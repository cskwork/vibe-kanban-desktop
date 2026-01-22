import { Menu, MenuItemConstructorOptions, shell, app } from 'electron'
import { VibeKanbanUpdater } from './updater/vibe-kanban-updater'
import { ElectronUpdater } from './updater/electron-updater'

export function createMenu(
  vibeKanbanUpdater: VibeKanbanUpdater,
  electronUpdater: ElectronUpdater
): Menu {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    // App 메뉴 (macOS)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              {
                label: '업데이트 확인...',
                click: (): void => {
                  electronUpdater.checkForUpdates()
                }
              },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),

    // File 메뉴
    {
      label: '파일',
      submenu: [
        {
          label: 'vibe-kanban 업데이트 확인',
          click: async (): Promise<void> => {
            await vibeKanbanUpdater.checkForUpdates()
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },

    // Edit 메뉴
    {
      label: '편집',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' as const },
              { role: 'delete' as const },
              { role: 'selectAll' as const }
            ]
          : [{ role: 'delete' as const }, { type: 'separator' as const }, { role: 'selectAll' as const }])
      ]
    },

    // View 메뉴
    {
      label: '보기',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },

    // Window 메뉴
    {
      label: '윈도우',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [{ type: 'separator' as const }, { role: 'front' as const }]
          : [{ role: 'close' as const }])
      ]
    },

    // Help 메뉴
    {
      label: '도움말',
      submenu: [
        {
          label: 'vibe-kanban 웹사이트',
          click: async (): Promise<void> => {
            await shell.openExternal('https://github.com/bloopai/vibe-kanban')
          }
        },
        {
          label: '문제 신고',
          click: async (): Promise<void> => {
            await shell.openExternal('https://github.com/bloopai/vibe-kanban/issues')
          }
        },
        { type: 'separator' },
        ...(!isMac
          ? [
              {
                label: '업데이트 확인...',
                click: (): void => {
                  electronUpdater.checkForUpdates()
                }
              }
            ]
          : [])
      ]
    }
  ]

  return Menu.buildFromTemplate(template)
}
