// IPC 채널 정의
export const IpcChannels = {
  // 앱 상태
  APP_READY: 'app:ready',
  APP_ERROR: 'app:error',

  // vibe-kanban 프로세스 상태
  VIBE_KANBAN_STARTING: 'vibe-kanban:starting',
  VIBE_KANBAN_READY: 'vibe-kanban:ready',
  VIBE_KANBAN_ERROR: 'vibe-kanban:error',
  VIBE_KANBAN_STOPPED: 'vibe-kanban:stopped',

  // 업데이트 관련
  UPDATE_CHECKING: 'update:checking',
  UPDATE_AVAILABLE: 'update:available',
  UPDATE_NOT_AVAILABLE: 'update:not-available',
  UPDATE_DOWNLOADING: 'update:downloading',
  UPDATE_DOWNLOADED: 'update:downloaded',
  UPDATE_ERROR: 'update:error',
  UPDATE_INSTALL: 'update:install',

  // vibe-kanban npm 업데이트
  NPM_UPDATE_AVAILABLE: 'npm:update-available',
  NPM_UPDATE_CHECK: 'npm:update-check',
  NPM_UPDATE_INSTALL: 'npm:update-install',

  // 윈도우 제어
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close'
} as const

// vibe-kanban 프로세스 상태
export type VibeKanbanStatus =
  | 'idle'
  | 'starting'
  | 'detecting-port'
  | 'health-checking'
  | 'ready'
  | 'error'
  | 'stopped'

// 앱 상태 정보
export interface AppState {
  vibeKanbanStatus: VibeKanbanStatus
  vibeKanbanPort: number | null
  vibeKanbanVersion: string | null
  errorMessage: string | null
}

// 업데이트 정보
export interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseNotes?: string
}

// npm 패키지 버전 정보
export interface NpmVersionInfo {
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
}
