import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { inspectContent, scanRepository } from '../scripts/check-secrets.mjs'
import { checkDeployment } from '../scripts/check-deployment.mjs'

const headers = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
).headers.find(({ source }) => source === '/(.*)').headers
const securityHeaders = () => Object.fromEntries(headers.map(({ key, value }) => [key, value]))
const assignment = (name, value) => `${name} = ${JSON.stringify(value)}`

test('민감값 검사는 서버 키와 개인 키·서비스 토큰을 찾고 빈 예시·테스트 값은 허용한다', () => {
  const sampleValue = 'a'.repeat(32)
  const content = [
    assignment('OPENWEATHER_API_KEY', sampleValue),
    JSON.stringify({ KAKAO_REST_API_KEY: sampleValue }),
    '-----BEGIN ' + 'PRIVATE KEY-----',
    'gh' + 'p_' + 'A'.repeat(36),
    'AK' + 'IA' + 'B'.repeat(16),
  ].join('\n')
  assert.equal(inspectContent('server.js', content).length, 5)
  assert.equal(JSON.stringify(inspectContent('server.js', content)).includes(sampleValue), false)
  assert.deepEqual(inspectContent('.env.example', 'OPENWEATHER_API_KEY=\nPORT=3001'), [])
  assert.deepEqual(inspectContent('test.js', "const TOKEN = 'test-only-token'"), [])
  assert.equal(inspectContent('.env.example', `KAKAO_REST_API_KEY=${sampleValue}`).length, 1)
  assert.equal(
    inspectContent(
      'server.js',
      assignment('OPENWEATHER_API_KEY', sampleValue).replace(' = ', ' =\n'),
    ).length,
    1,
  )
})

test('Git 추적 민감 파일·미추적 소스는 검사하고 개발 환경·산출물·잠금 hash는 제외한다', (t) => {
  const cwd = mkdtempSync(join(tmpdir(), 'skala-secrets-check-'))
  t.after(() => rmSync(cwd, { recursive: true, force: true }))
  const git = (...args) => execFileSync('git', args, { cwd, stdio: 'ignore' })
  const write = (file, content) => writeFileSync(join(cwd, file), content)
  git('init', '-q')
  write('.gitignore', '.env*\n!.env.example\nnode_modules/\ndist/\n')
  write('.env.example', 'OPENWEATHER_API_KEY=\nKAKAO_REST_API_KEY=\nPORT=3001\n')
  write('.env.local', `OPENWEATHER_API_KEY=${'a'.repeat(32)}`)
  write('package-lock.json', JSON.stringify({ integrity: 'sha512-' + 'A'.repeat(64) }))
  git('add', '.gitignore', '.env.example', 'package-lock.json')
  for (const dir of ['node_modules', 'dist']) {
    mkdirSync(join(cwd, dir))
    write(`${dir}/ignore.js`, assignment('SECRET', 'c'.repeat(32)))
  }
  assert.deepEqual(scanRepository(cwd).findings, [])
  write('new-source.js', assignment('KAKAO_REST_API_KEY', 'b'.repeat(32)))
  symlinkSync(join(cwd, '.env.local'), join(cwd, 'local-link.js'))
  write('.env.production', '')
  write('signing.pem', '')
  git('add', '-f', '.env.production', 'signing.pem')
  const { findings } = scanRepository(cwd)
  assert.deepEqual(findings.map(({ file }) => file).sort(), [
    '.env.production',
    'new-source.js',
    'signing.pem',
  ])
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL('../scripts/check-secrets.mjs', import.meta.url))],
    { cwd, encoding: 'utf8' },
  )
  assert.equal(result.status, 1)
  assert.equal(result.stdout.includes('3건'), true)
  assert.equal(result.stderr.includes('b'.repeat(32)), false)
})

test('배포 검사는 키·좌표 없이 루트와 존재하지 않는 API를 한 번씩 읽는다', async () => {
  const requests = []
  const results = await checkDeployment('https://deployment.example', async (url, options) => {
    requests.push({ url, options })
    return new Response(null, {
      status: url.pathname === '/' ? 200 : 404,
      headers: {
        ...securityHeaders(),
        'Content-Type': url.pathname === '/' ? 'text/html; charset=utf-8' : 'application/json',
        'Cache-Control': 'no-store',
      },
    })
  })
  assert.deepEqual(
    results.map(({ issues }) => issues),
    [[], []],
  )
  assert.deepEqual(
    requests.map(({ url }) => url.pathname),
    ['/', '/api/weather/__deployment_probe__'],
  )
  for (const { url, options } of requests) {
    assert.equal(url.search, '')
    assert.equal(options.method, 'GET')
    assert.equal(options.redirect, 'manual')
    assert.equal(options.headers, undefined)
  }
})

test('배포 검사는 약화된 보안 정책·리다이렉트·HTML API 응답·저장 가능 API를 실패 처리한다', async () => {
  const results = await checkDeployment(
    'https://deployment.example/',
    async (url) =>
      new Response(null, {
        status: url.pathname === '/' ? 302 : 200,
        headers: {
          ...securityHeaders(),
          'Content-Security-Policy': 'default-src *',
          'Content-Type': 'text/html',
        },
      }),
  )
  assert.equal(
    results.every(({ issues }) => issues.some((issue) => issue.includes('HTTP'))),
    true,
  )
  assert.equal(
    results.every(({ issues }) =>
      issues.some((issue) => issue.includes('Content-Security-Policy')),
    ),
    true,
  )
  assert.equal(results[1].issues.includes('응답 형식 불일치'), true)
  assert.equal(results[1].issues.includes('API Cache-Control no-store 누락'), true)
})

test('배포 검사는 인증정보·쿼리·경로 입력을 요청 전에 거절하고 연결 오류 내용을 노출하지 않는다', async () => {
  const fetch = () => assert.fail('Unsafe URL must not be fetched')
  for (const url of [
    'http://deployment.example',
    'https://user:password@deployment.example',
    'https://deployment.example?token=private',
    'https://deployment.example/private',
    'https://deployment.example#private',
  ]) {
    await assert.rejects(checkDeployment(url, fetch))
  }
  const results = await checkDeployment('https://deployment.example', () => {
    throw new Error('private-token')
  })
  assert.equal(results.length, 2)
  assert.equal(
    results.every(({ status, issues }) => status === null && issues.length === 1),
    true,
  )
  assert.equal(JSON.stringify(results).includes('private-token'), false)
})
