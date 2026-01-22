import { net } from 'electron'

export interface HealthCheckOptions {
  maxRetries?: number
  retryDelayMs?: number
  timeoutMs?: number
}

const DEFAULT_OPTIONS: Required<HealthCheckOptions> = {
  maxRetries: 10,
  retryDelayMs: 500,
  timeoutMs: 5000
}

// HTTP HEAD 요청으로 서버 상태 확인
async function checkServerHealth(url: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const request = net.request({
      method: 'HEAD',
      url
    })

    const timeout = setTimeout(() => {
      request.abort()
      resolve(false)
    }, timeoutMs)

    request.on('response', (response) => {
      clearTimeout(timeout)
      resolve(response.statusCode >= 200 && response.statusCode < 400)
    })

    request.on('error', () => {
      clearTimeout(timeout)
      resolve(false)
    })

    request.end()
  })
}

// 딜레이 유틸
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 재시도 로직이 포함된 헬스 체크
export async function waitForServerReady(
  url: string,
  options: HealthCheckOptions = {}
): Promise<boolean> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    console.log(`[HealthChecker] 헬스 체크 시도 ${attempt}/${opts.maxRetries}: ${url}`)

    const healthy = await checkServerHealth(url, opts.timeoutMs)
    if (healthy) {
      console.log(`[HealthChecker] 서버 준비 완료: ${url}`)
      return true
    }

    if (attempt < opts.maxRetries) {
      await delay(opts.retryDelayMs)
    }
  }

  console.error(`[HealthChecker] 서버 헬스 체크 실패: ${url}`)
  return false
}
