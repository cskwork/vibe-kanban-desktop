# vibe-kanban-desktop

<!-- AUTO-MANAGED: project-description -->
Electron + TypeScript desktop wrapper for vibe-kanban with dual updater system, automatic port detection, health checks, and splash screen. Provides secure main/preload/renderer architecture.
<!-- END AUTO-MANAGED -->

## Build Commands

<!-- AUTO-MANAGED: build-commands -->
- `npm run dev` - Start dev server with hot reload
- `npm run build` - Build with electron-vite
- `npm run typecheck` - Type check with tsc
- `npm run lint` - Lint with ESLint
- `npm run package` - Build and package for current platform
- `npm run package:mac` - Package for macOS
- `npm run package:win` - Package for Windows
- `npm run package:linux` - Package for Linux
<!-- END AUTO-MANAGED -->

## Architecture

<!-- AUTO-MANAGED: architecture -->
```
build/
├── icon.svg                    - Kanban board icon (SVG source)
├── icon.png                    - Kanban board icon (PNG for packaging)
├── icon.icns                   - macOS icon bundle
├── icon.ico                    - Windows icon file
├── icons/                      - Multi-size PNG icons for packaging
src/
├── main/
│   ├── main.ts                 - App entry, window creation, lifecycle, icon setup
│   ├── vibe-kanban-manager.ts  - Child process spawning and event management
│   ├── port-detector.ts        - Extract port from vibe-kanban stdout
│   ├── health-checker.ts       - HTTP HEAD retry logic for server readiness
│   ├── menu.ts                 - App menu with update/help actions
│   ├── ipc/
│   │   └── handlers.ts         - IPC event handlers (state, updates)
│   └── updater/
│       ├── electron-updater.ts - GitHub Releases based app auto-update
│       └── vibe-kanban-updater.ts - npm registry version check
├── preload/
│   └── preload.ts              - Secure context bridge to renderer
├── renderer/
│   └── splash/index.html       - Loading screen during startup
└── shared/
    └── types.ts                - IPC channels, app state types
```

### Key Components
- **VibeKanbanManager**: EventEmitter managing `npx vibe-kanban@latest` child process with error handling
- **PortDetector**: Regex pattern matching on stdout to extract `http://127.0.0.1:PORT`
- **HealthChecker**: Retry logic (10 attempts, 500ms delay) using electron.net.request HEAD
- **Dual Updater**: ElectronUpdater for app (GitHub), VibeKanbanUpdater for vibe-kanban (npm)
<!-- END AUTO-MANAGED -->

## Conventions

<!-- AUTO-MANAGED: conventions -->
- **TypeScript**: Strict mode enabled, ES2022 target, path aliases (@main, @preload, @renderer, @shared)
- **Comments**: Korean language, concise explanations in code
- **IPC Channels**: Namespaced with colons (app:, vibe-kanban:, update:, npm:, window:)
- **Error Handling**: Prefix log messages with [ComponentName] for traceability
- **Security**: contextIsolation=true, sandbox=true, nodeIntegration=false, localhost-only navigation
<!-- END AUTO-MANAGED -->

## Patterns

<!-- AUTO-MANAGED: patterns -->
- **EventEmitter for async operations**: VibeKanbanManager, updaters emit lifecycle events
- **Promise-based port detection**: Timeout handling with AbortController pattern
- **Retry logic**: HealthChecker implements exponential backoff pattern
- **Process spawn with stdio pipe**: stdout/stderr handling for vibe-kanban output parsing
- **Splash screen pattern**: Separate BrowserWindow shown during initialization
<!-- END AUTO-MANAGED -->

## Dependencies

<!-- AUTO-MANAGED: dependencies -->
### Production
- electron-updater ^6.3.9 - GitHub Releases update integration

### Dev
- @electron-toolkit/* - ESLint config and TypeScript setup
- electron ^33.3.1 - Electron runtime
- electron-builder ^25.1.8 - Cross-platform packaging
- electron-vite ^2.3.0 - Build tool for main/preload/renderer
- typescript ^5.7.3 - TypeScript compiler
- @typescript-eslint/* - Linting
<!-- END AUTO-MANAGED -->

## Git Insights

<!-- AUTO-MANAGED: git-insights -->
Initial project creation with complete Electron + TypeScript setup:
- vibe-kanban process management with stdout port detection
- Dual update system (app + npm package)
- Security hardening (context isolation, sandbox)
- App icon integration (macOS/Windows/Linux) with BrowserWindow configuration
- macOS Dock icon handling via `app.dock.setIcon()` in bootstrap() - resolves dev/packaged mode icon display
- Changelog documented in docs/changelog/changelog-2026-01-22.md
<!-- END AUTO-MANAGED -->

## Testing & Validation

<!-- MANUAL -->
- Typecheck: `npm run typecheck` (passes)
- Lint: `npm run lint` (passes)
- Build: `npm run build` (successful)
<!-- END MANUAL -->

## Next Steps

<!-- MANUAL -->
1. Implement renderer UI to display vibe-kanban via IPC communication
2. Add e2e tests with Playwright
3. Configure CI/CD for GitHub Releases (for ElectronUpdater)
4. Test packaging on all three platforms (macOS/Windows/Linux)
<!-- END MANUAL -->
