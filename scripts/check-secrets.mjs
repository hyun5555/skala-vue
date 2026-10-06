import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const excludedPath = /(?:^|\/)(?:\.git|node_modules|dist|dist-ssr|coverage)(?:\/|$)/
const credentialPath =
  /(?:^|\/)(?:\.aws|\.azure|\.gcloud|\.ssh|\.kube|secrets|\.secrets|credentials)(?:\/|$)|(?:^|\/)(?:\.npmrc|\.pypirc|credentials\.json|.*\.credentials\.json|service[-_]?account.*\.json|.*-service-account\.json|id_(?:rsa|ecdsa|ed25519).*)$|\.(?:pem|key|crt|cer|p12|pfx|jks|keystore)$/i
const sensitiveName =
  /(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|secret|token)/i
const placeholder =
  /^(?:test-only(?:[-_].*)?|(?:your|example|placeholder|dummy|fake|test)(?:[-_].*)?|changeme|replace[-_].*|<[^>]*>|\$\{[^}]*\})$/i
const strongPatterns = [
  ['개인 키', /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/],
  ['GitHub 토큰', /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b/],
  ['AWS 접근 키', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  [
    '서비스 토큰',
    /\b(?:sk_(?:live|test)_[A-Za-z0-9]{20,}|sk-(?:proj-)?[A-Za-z0-9_-]{32,}|xox[baprs]-[A-Za-z0-9-]{20,}|AIza[A-Za-z0-9_-]{35})\b/,
  ],
  ['인증 헤더', /\b(?:KakaoAK|Bearer)\s+[A-Za-z0-9._-]{24,}/],
]

export const inspectContent = (file, content) => {
  const findings = []
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    const add = (reason) => findings.push({ file, line: index + 1, reason })
    for (const [reason, pattern] of strongPatterns) {
      if (pattern.test(line)) add(reason)
    }
    if (basename(file) === '.env.example') {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([^#\r\n]*)/)
      const value = match?.[2].trim().replace(/^["']|["']$/g, '')
      if (match && sensitiveName.test(match[1]) && value && !placeholder.test(value)) {
        add('환경 예시 파일의 민감값')
      }
    }
  }
  for (const match of content.matchAll(
    /["']?([A-Za-z_][A-Za-z0-9_-]*)["']?\s*[:=]\s*(["'`])([^"'`\r\n]+)\2/g,
  )) {
    if (sensitiveName.test(match[1]) && !placeholder.test(match[3].trim())) {
      findings.push({
        file,
        line: content.slice(0, match.index).split('\n').length,
        reason: '민감한 설정의 하드코딩',
      })
    }
  }
  return findings
}

export const scanRepository = (cwd = process.cwd()) => {
  const list = (args) =>
    execFileSync('git', ['ls-files', '-z', ...args], {
      cwd,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    })
      .split('\0')
      .filter(Boolean)
  const tracked = new Set(list(['--cached']))
  const files = new Set([...tracked, ...list(['--others', '--exclude-standard'])])
  const findings = []
  let checked = 0
  for (const file of files) {
    const name = basename(file)
    if (
      tracked.has(file) &&
      ((name.startsWith('.env') && name !== '.env.example') || credentialPath.test(file))
    ) {
      findings.push({ file, line: 1, reason: '민감 파일이 Git에 추적됨' })
    }
    if (
      excludedPath.test(file) ||
      /^(?:package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml)$/.test(name)
    )
      continue
    const path = resolve(cwd, file)
    let content
    try {
      // Read regular files only; never follow a repository symlink to local credentials.
      if (!lstatSync(path).isFile()) continue
      content = readFileSync(path)
    } catch (error) {
      if (error.code === 'ENOENT') continue // Deleted working-tree files have no content to scan.
      throw error
    }
    if (content.includes(0)) continue
    checked += 1
    findings.push(...inspectContent(file, content.toString('utf8')))
  }
  return { checked, findings }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { checked, findings } = scanRepository()
    for (const { file, line, reason } of findings) {
      console.error(`${JSON.stringify(file)}:${line} ${reason}`)
    }
    console.log(`민감값 검사: ${checked}개 파일, ${findings.length}건`)
    process.exitCode = findings.length ? 1 : 0
  } catch {
    console.error('민감값 검사 실패: Git 저장소 또는 파일 접근을 확인하세요.')
    process.exitCode = 1
  }
}
