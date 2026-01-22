import { autoUpdater, UpdateInfo } from 'electron-updater'
import { BrowserWindow, dialog } from 'electron'
import { IpcChannels } from '../../shared/types'

export class ElectronUpdater {
  private mainWindow: BrowserWindow | null = null

  constructor() {
    // 로깅 설정
    autoUpdater.logger = console
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.allowPrerelease = false

    this.setupEventHandlers()
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  private setupEventHandlers(): void {
    autoUpdater.on('checking-for-update', () => {
      console.log('[ElectronUpdater] 업데이트 확인 중...')
      this.sendToRenderer(IpcChannels.UPDATE_CHECKING)
    })

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      console.log('[ElectronUpdater] 업데이트 가능:', info.version)
      this.sendToRenderer(IpcChannels.UPDATE_AVAILABLE, info)
      this.promptForDownload(info)
    })

    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      console.log('[ElectronUpdater] 최신 버전 사용 중:', info.version)
      this.sendToRenderer(IpcChannels.UPDATE_NOT_AVAILABLE, info)
    })

    autoUpdater.on('error', (err) => {
      console.error('[ElectronUpdater] 업데이트 에러:', err)
      this.sendToRenderer(IpcChannels.UPDATE_ERROR, err.message)
    })

    autoUpdater.on('download-progress', (progress) => {
      console.log(`[ElectronUpdater] 다운로드 진행: ${progress.percent.toFixed(1)}%`)
      this.sendToRenderer(IpcChannels.UPDATE_DOWNLOADING, progress)
    })

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      console.log('[ElectronUpdater] 업데이트 다운로드 완료:', info.version)
      this.sendToRenderer(IpcChannels.UPDATE_DOWNLOADED, info)
      this.promptForInstall(info)
    })
  }

  private sendToRenderer(channel: string, data?: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data)
    }
  }

  private async promptForDownload(info: UpdateInfo): Promise<void> {
    if (!this.mainWindow) return

    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: '업데이트 가능',
      message: `새 버전 ${info.version}이 있습니다. 다운로드하시겠습니까?`,
      buttons: ['다운로드', '나중에'],
      defaultId: 0
    })

    if (result.response === 0) {
      autoUpdater.downloadUpdate()
    }
  }

  private async promptForInstall(info: UpdateInfo): Promise<void> {
    if (!this.mainWindow) return

    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: '업데이트 준비 완료',
      message: `버전 ${info.version}이 다운로드되었습니다. 지금 재시작하여 설치하시겠습니까?`,
      buttons: ['재시작', '나중에'],
      defaultId: 0
    })

    if (result.response === 0) {
      autoUpdater.quitAndInstall(false, true)
    }
  }

  // 업데이트 확인 시작
  checkForUpdates(): void {
    console.log('[ElectronUpdater] 업데이트 확인 시작')
    autoUpdater.checkForUpdates()
  }

  // 수동 업데이트 설치
  quitAndInstall(): void {
    autoUpdater.quitAndInstall(false, true)
  }
}
