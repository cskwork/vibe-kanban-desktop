import { ipcMain, BrowserWindow } from 'electron'
import { IpcChannels } from '../../shared/types'
import { VibeKanbanManager } from '../vibe-kanban-manager'
import { ElectronUpdater } from '../updater/electron-updater'
import { VibeKanbanUpdater } from '../updater/vibe-kanban-updater'

export function setupIpcHandlers(
  manager: VibeKanbanManager,
  electronUpdater: ElectronUpdater,
  vibeKanbanUpdater: VibeKanbanUpdater
): void {
  // 윈도우 제어
  ipcMain.on(IpcChannels.WINDOW_MINIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.minimize()
  })

  ipcMain.on(IpcChannels.WINDOW_MAXIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.on(IpcChannels.WINDOW_CLOSE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.close()
  })

  // 앱 업데이트 설치
  ipcMain.on(IpcChannels.UPDATE_INSTALL, () => {
    electronUpdater.quitAndInstall()
  })

  // npm 업데이트 확인
  ipcMain.handle(IpcChannels.NPM_UPDATE_CHECK, async () => {
    return vibeKanbanUpdater.checkForUpdates()
  })

  // npm 업데이트 설치 (vibe-kanban 재시작)
  ipcMain.handle(IpcChannels.NPM_UPDATE_INSTALL, async () => {
    try {
      const url = await manager.restart()
      return { success: true, url }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}
