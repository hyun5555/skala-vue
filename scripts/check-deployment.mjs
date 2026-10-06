import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const { headers } = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
const expectedHeaders = headers.find(({ source }) => source === '/(.*)').headers
const normalize = (value) => value?.trim().replace(/\s+/g, ' ')

export const checkDeployment = async (input, fetchImpl = fetch) => {
  const base = new URL(input)
  if (
    base.protocol !== 'https:' ||
    base.username ||
    base.password ||
    base.search ||
    base.hash ||
    base.pathname !== '/'
  ) {
    throw new Error('인증정보·경로·쿼리가 없는 HTTPS 서비스 주소가 필요합니다.')
  }
  const results = []
  for (const [path, expectedStatus, type] of [
    ['/', 200, 'text/html'],
    ['/api/weather/__deployment_probe__', 404, 'application/json'],
  ]) {
    try {
      const response = await fetchImpl(new URL(path, base), {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
      })
      const issues = []
      if (response.status !== expectedStatus) issues.push(`예상 HTTP ${expectedStatus} 불일치`)
      if (!response.headers.get('Content-Type')?.toLowerCase().includes(type))
        issues.push('응답 형식 불일치')
      for (const { key, value } of expectedHeaders) {
        if (normalize(response.headers.get(key)) !== normalize(value))
          issues.push(`${key} 정책 불일치 또는 누락`)
      }
      if (
        path.startsWith('/api/') &&
        !response.headers
          .get('Cache-Control')
          ?.toLowerCase()
          .split(',')
          .some((part) => part.trim() === 'no-store')
      ) {
        issues.push('API Cache-Control no-store 누락')
      }
      await response.body?.cancel()
      results.push({ path, status: response.status, issues })
    } catch {
      results.push({ path, status: null, issues: ['연결 실패 또는 시간 초과'] })
    }
  }
  return results
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.length !== 3) throw new Error('서비스 주소가 필요합니다.')
    const results = await checkDeployment(process.argv[2])
    for (const { path, status, issues } of results) {
      console.log(
        `${path}: HTTP ${status ?? '연결 실패'}, ${issues.length ? issues.join(', ') : '정책 확인 통과'}`,
      )
    }
    process.exitCode = results.some(({ issues }) => issues.length) ? 1 : 0
  } catch {
    console.error(
      '사용법: npm run deployment:check -- https://서비스주소 (경로·쿼리·인증정보 제외)',
    )
    process.exitCode = 1
  }
}
