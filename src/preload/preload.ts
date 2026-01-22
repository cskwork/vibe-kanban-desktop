import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { IpcChannels } from '../shared/types'

// 렌더러에 노출할 API
const electronAPI = {
  // 윈도우 제어
  minimize: (): void => ipcRenderer.send(IpcChannels.WINDOW_MINIMIZE),
  maximize: (): void => ipcRenderer.send(IpcChannels.WINDOW_MAXIMIZE),
  close: (): void => ipcRenderer.send(IpcChannels.WINDOW_CLOSE),

  // 앱 업데이트
  installUpdate: (): void => ipcRenderer.send(IpcChannels.UPDATE_INSTALL),

  // npm 업데이트
  checkNpmUpdate: (): Promise<unknown> => ipcRenderer.invoke(IpcChannels.NPM_UPDATE_CHECK),
  installNpmUpdate: (): Promise<unknown> => ipcRenderer.invoke(IpcChannels.NPM_UPDATE_INSTALL),

  // 이벤트 리스너
  on: (channel: string, callback: (...args: unknown[]) => void): (() => void) => {
    const allowedChannels = Object.values(IpcChannels)
    if (allowedChannels.includes(channel as typeof allowedChannels[number])) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]): void => {
        callback(...args)
      }
      ipcRenderer.on(channel, subscription)

      // 구독 해제 함수 반환
      return (): void => {
        ipcRenderer.removeListener(channel, subscription)
      }
    }
    return (): void => {}
  },

  // 일회성 이벤트 리스너
  once: (channel: string, callback: (...args: unknown[]) => void): void => {
    const allowedChannels = Object.values(IpcChannels)
    if (allowedChannels.includes(channel as typeof allowedChannels[number])) {
      ipcRenderer.once(channel, (_event, ...args) => callback(...args))
    }
  }
}

// Context Bridge로 안전하게 노출
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// TypeScript 타입 선언
export type ElectronAPI = typeof electronAPI
