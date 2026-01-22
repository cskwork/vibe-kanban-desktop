import { net } from 'electron'
import { NpmVersionInfo, IpcChannels } from '../../shared/types'
import { BrowserWindow } from 'electron'

const NPM_REGISTRY_URL = 'https://registry.npmjs.org/vibe-kanban'

export class VibeKanbanUpdater {
  private mainWindow: BrowserWindow | null = null
  private currentVersion: string | null = null
  private checkIntervalId: NodeJS.Timeout | null = null

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  setCurrentVersion(version: string): void {
    this.currentVersion = version
  }

  // npm registry에서 최신 버전 조회
  private async fetchLatestVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
      const request = net.request({
        method: 'GET',
        url: NPM_REGISTRY_URL
      })

      let data = ''

      request.on('response', (response) => {
        response.on('data', (chunk) => {
          data += chunk.toString()
        })

        response.on('end', () => {
          try {
            const json = JSON.parse(data)
            const latestVersion = json['dist-tags']?.latest
            if (latestVersion) {
              resolve(latestVersion)
            } else {
              reject(new Error('latest 버전을 찾을 수 없습니다'))
            }
          } catch (err) {
            reject(err)
          }
        })
      })

      request.on('error', reject)
      request.end()
    })
  }

  // 버전 비교 (semver 간단 비교)
  private compareVersions(current: string, latest: string): boolean {
    const currentParts = current.replace(/^v/, '').split('.').map(Number)
    const latestParts = latest.replace(/^v/, '').split('.').map(Number)

    for (let i = 0; i < 3; i++) {
      const c = currentParts[i] || 0
      const l = latestParts[i] || 0
      if (l > c) return true
      if (l < c) return false
    }
    return false
  }

  // 업데이트 확인
  async checkForUpdates(): Promise<NpmVersionInfo | null> {
    if (!this.currentVersion) {
      console.log('[VibeKanbanUpdater] 현재 버전 정보 없음')
      return null
    }

    try {
      console.log('[VibeKanbanUpdater] npm 버전 확인 중...')
      const latestVersion = await this.fetchLatestVersion()
      const updateAvailable = this.compareVersions(this.currentVersion, latestVersion)

      const info: NpmVersionInfo = {
        currentVersion: this.currentVersion,
        latestVersion,
        updateAvailable
      }

      console.log(`[VibeKanbanUpdater] 현재: ${this.currentVersion}, 최신: ${latestVersion}, 업데이트 가능: ${updateAvailable}`)

      if (updateAvailable && this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send(IpcChannels.NPM_UPDATE_AVAILABLE, info)
      }

      return info
    } catch (error) {
      console.error('[VibeKanbanUpdater] 버전 확인 실패:', error)
      return null
    }
  }

  // 주기적 확인 시작 (기본 1시간)
  startPeriodicCheck(intervalMs = 60 * 60 * 1000): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId)
    }

    this.checkIntervalId = setInterval(() => {
      this.checkForUpdates()
    }, intervalMs)

    // 즉시 한 번 확인
    this.checkForUpdates()
  }

  // 주기적 확인 중지
  stopPeriodicCheck(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId)
      this.checkIntervalId = null
    }
  }
}
