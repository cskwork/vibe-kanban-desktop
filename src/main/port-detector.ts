// stdout에서 포트 번호 감지
const PORT_PATTERN = /http:\/\/127\.0\.0\.1:(\d+)/

export interface PortDetectionResult {
  port: number
  url: string
}

export function detectPortFromOutput(output: string): PortDetectionResult | null {
  const match = output.match(PORT_PATTERN)
  if (match) {
    const port = parseInt(match[1], 10)
    return {
      port,
      url: `http://127.0.0.1:${port}`
    }
  }
  return null
}

export class PortDetector {
  private buffer = ''
  private resolved = false
  private resolvePort: ((result: PortDetectionResult) => void) | null = null
  private rejectPort: ((error: Error) => void) | null = null

  constructor(private timeoutMs = 30000) {}

  // stdout 데이터 처리
  processData(data: string): PortDetectionResult | null {
    if (this.resolved) return null

    this.buffer += data
    const result = detectPortFromOutput(this.buffer)

    if (result && this.resolvePort) {
      this.resolved = true
      this.resolvePort(result)
      return result
    }

    return result
  }

  // 포트 감지 Promise 반환
  waitForPort(): Promise<PortDetectionResult> {
    return new Promise((resolve, reject) => {
      this.resolvePort = resolve
      this.rejectPort = reject

      setTimeout(() => {
        if (!this.resolved) {
          this.resolved = true
          reject(new Error(`포트 감지 타임아웃 (${this.timeoutMs}ms)`))
        }
      }, this.timeoutMs)
    })
  }

  // 수동 에러 발생
  abort(error: Error): void {
    if (!this.resolved && this.rejectPort) {
      this.resolved = true
      this.rejectPort(error)
    }
  }

  // 리셋
  reset(): void {
    this.buffer = ''
    this.resolved = false
    this.resolvePort = null
    this.rejectPort = null
  }
}
