import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import { PortDetector, PortDetectionResult } from './port-detector'
import { waitForServerReady } from './health-checker'

export interface VibeKanbanManagerEvents {
  starting: () => void
  'port-detected': (result: PortDetectionResult) => void
  ready: (url: string) => void
  error: (error: Error) => void
  stopped: (code: number | null) => void
  output: (data: string) => void
}

export class VibeKanbanManager extends EventEmitter {
  private process: ChildProcess | null = null
  private portDetector: PortDetector
  private serverUrl: string | null = null
  private isStarting = false

  constructor(private portDetectionTimeoutMs = 30000) {
    super()
    this.portDetector = new PortDetector(portDetectionTimeoutMs)
  }

  // vibe-kanban 프로세스 시작
  async start(): Promise<string> {
    if (this.process || this.isStarting) {
      throw new Error('vibe-kanban이 이미 실행 중입니다')
    }

    this.isStarting = true
    this.portDetector.reset()
    this.emit('starting')

    return new Promise((resolve, reject) => {
      console.log('[VibeKanbanManager] npx vibe-kanban@latest 실행 중...')

      // npx vibe-kanban@latest 실행 (--no-open으로 브라우저 자동 열기 방지)
      this.process = spawn('npx', ['vibe-kanban@latest', '--no-open'], {
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          BROWSER: 'none', // 브라우저 자동 열기 방지
          NO_OPEN: '1'
        }
      })

      // stdout 처리
      this.process.stdout?.on('data', (data: Buffer) => {
        const output = data.toString()
        console.log('[vibe-kanban stdout]', output)
        this.emit('output', output)

        const result = this.portDetector.processData(output)
        if (result) {
          this.emit('port-detected', result)
        }
      })

      // stderr 처리
      this.process.stderr?.on('data', (data: Buffer) => {
        const output = data.toString()
        console.error('[vibe-kanban stderr]', output)
        this.emit('output', output)
      })

      // 프로세스 종료 처리
      this.process.on('close', (code) => {
        console.log(`[VibeKanbanManager] 프로세스 종료: code=${code}`)
        this.process = null
        this.isStarting = false
        this.emit('stopped', code)

        if (this.isStarting) {
          reject(new Error(`vibe-kanban이 예상치 못하게 종료됨 (code: ${code})`))
        }
      })

      // 프로세스 에러 처리
      this.process.on('error', (error) => {
        console.error('[VibeKanbanManager] 프로세스 에러:', error)
        this.isStarting = false
        this.portDetector.abort(error)
        this.emit('error', error)
        reject(error)
      })

      // 포트 감지 대기
      this.portDetector
        .waitForPort()
        .then(async (result) => {
          console.log(`[VibeKanbanManager] 포트 감지됨: ${result.port}`)

          // 헬스 체크
          const healthy = await waitForServerReady(result.url)
          if (!healthy) {
            const error = new Error('서버 헬스 체크 실패')
            this.emit('error', error)
            reject(error)
            return
          }

          this.serverUrl = result.url
          this.isStarting = false
          this.emit('ready', result.url)
          resolve(result.url)
        })
        .catch((error) => {
          this.isStarting = false
          this.emit('error', error)
          reject(error)
        })
    })
  }

  // vibe-kanban 프로세스 종료
  stop(): void {
    if (this.process) {
      console.log('[VibeKanbanManager] 프로세스 종료 요청')

      // Windows에서는 tree-kill 필요할 수 있음
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(this.process.pid), '/f', '/t'], { shell: true })
      } else {
        this.process.kill('SIGTERM')
      }

      this.process = null
    }
    this.serverUrl = null
    this.portDetector.reset()
  }

  // 현재 서버 URL 반환
  getServerUrl(): string | null {
    return this.serverUrl
  }

  // 실행 중 여부
  isRunning(): boolean {
    return this.process !== null && !this.isStarting
  }

  // 재시작
  async restart(): Promise<string> {
    this.stop()
    return this.start()
  }
}
