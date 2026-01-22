import { app, BrowserWindow, Menu, shell } from 'electron'
import { join } from 'path'
import { VibeKanbanManager } from './vibe-kanban-manager'
import { ElectronUpdater } from './updater/electron-updater'
import { VibeKanbanUpdater } from './updater/vibe-kanban-updater'
import { setupIpcHandlers } from './ipc/handlers'
import { createMenu } from './menu'
import { IpcChannels } from '../shared/types'

// 싱글 인스턴스 보장
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

let mainWindow: BrowserWindow | null = null
let splashWindow: BrowserWindow | null = null
const vibeKanbanManager = new VibeKanbanManager()
const electronUpdater = new ElectronUpdater()
const vibeKanbanUpdater = new VibeKanbanUpdater()

function createSplashWindow(): BrowserWindow {
  const splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (app.isPackaged) {
    splash.loadFile(join(__dirname, '../renderer/splash/index.html'))
  } else {
    splash.loadFile(join(__dirname, '../../src/renderer/splash/index.html'))
  }

  return splash
}

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    icon: join(__dirname, '../../build/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: join(__dirname, '../preload/preload.js')
    }
  })

  // 보안: localhost만 허용
  window.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://127.0.0.1')) {
      event.preventDefault()
    }
  })

  // 외부 링크는 기본 브라우저에서 열기
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://127.0.0.1')) {
      return { action: 'allow' }
    }
    shell.openExternal(url)
    return { action: 'deny' }
  })

  return window
}

async function bootstrap(): Promise<void> {
  // macOS Dock 아이콘 설정
  if (process.platform === 'darwin' && app.dock) {
    const iconPath = app.isPackaged
      ? join(process.resourcesPath, 'icon.png')
      : join(__dirname, '../../build/icon.png')
    app.dock.setIcon(iconPath)
  }

  // Splash 표시
  splashWindow = createSplashWindow()

  // 메인 윈도우 생성 (숨김)
  mainWindow = createMainWindow()
  electronUpdater.setMainWindow(mainWindow)
  vibeKanbanUpdater.setMainWindow(mainWindow)

  // IPC 핸들러 설정
  setupIpcHandlers(vibeKanbanManager, electronUpdater, vibeKanbanUpdater)

  // 메뉴 설정
  const menu = createMenu(vibeKanbanUpdater, electronUpdater)
  Menu.setApplicationMenu(menu)

  // vibe-kanban 이벤트 핸들러
  vibeKanbanManager.on('starting', () => {
    mainWindow?.webContents.send(IpcChannels.VIBE_KANBAN_STARTING)
  })

  vibeKanbanManager.on('ready', (url: string) => {
    mainWindow?.webContents.send(IpcChannels.VIBE_KANBAN_READY, url)
  })

  vibeKanbanManager.on('error', (error: Error) => {
    mainWindow?.webContents.send(IpcChannels.VIBE_KANBAN_ERROR, error.message)
  })

  vibeKanbanManager.on('stopped', (code: number | null) => {
    mainWindow?.webContents.send(IpcChannels.VIBE_KANBAN_STOPPED, code)
  })

  try {
    // vibe-kanban 시작 및 URL 획득
    const serverUrl = await vibeKanbanManager.start()
    console.log(`[Main] vibe-kanban 서버 준비 완료: ${serverUrl}`)

    // 메인 윈도우에 URL 로드
    await mainWindow.loadURL(serverUrl)

    // Splash 닫고 메인 윈도우 표시
    splashWindow?.close()
    splashWindow = null
    mainWindow.show()

    // 업데이트 확인 시작
    electronUpdater.checkForUpdates()
    vibeKanbanUpdater.startPeriodicCheck()
  } catch (error) {
    console.error('[Main] vibe-kanban 시작 실패:', error)
    splashWindow?.close()

    // 에러 다이얼로그 표시
    const { dialog } = await import('electron')
    await dialog.showMessageBox({
      type: 'error',
      title: 'vibe-kanban 시작 실패',
      message: `vibe-kanban을 시작할 수 없습니다.\n\n${(error as Error).message}`,
      buttons: ['종료']
    })

    app.quit()
  }
}

// 앱 준비 완료
app.whenReady().then(bootstrap)

// 싱글 인스턴스: 두 번째 인스턴스 시도 시 기존 윈도우 포커스
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

// 모든 윈도우 닫힘
app.on('window-all-closed', () => {
  vibeKanbanManager.stop()
  vibeKanbanUpdater.stopPeriodicCheck()

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// macOS: dock 아이콘 클릭 시
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    bootstrap()
  }
})

// 앱 종료 전 정리
app.on('before-quit', () => {
  vibeKanbanManager.stop()
})
