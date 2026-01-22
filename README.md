# vibe-kanban-desktop

Electron desktop wrapper for vibe-kanban with auto-updates, health checks, and secure architecture.

## Features

- **Process Management** - Automatic spawning and lifecycle management of vibe-kanban via `npx`
- **Auto Port Detection** - Extracts server port from stdout using regex pattern matching
- **Health Checks** - Retry logic (10 attempts, 500ms delay) ensures server readiness before loading
- **Dual Update System** - App updates via GitHub Releases + vibe-kanban updates via npm registry
- **Splash Screen** - Loading screen displayed during initialization
- **Security Hardened** - Context isolation, sandbox mode, disabled node integration

## System Requirements

- Node.js 18+
- npm 9+
- macOS 10.15+ / Windows 10+ / Ubuntu 20.04+

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/vibe-kanban-desktop.git
cd vibe-kanban-desktop

# Install dependencies
npm install
```

## Development

```bash
# Start development server with hot reload
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Build
npm run build

# Preview built app
npm run preview
```

## Packaging

```bash
# Package for current platform
npm run package

# Platform-specific packaging
npm run package:mac    # macOS
npm run package:win    # Windows
npm run package:linux  # Linux
```

## Project Structure

```
src/
├── main/
│   ├── main.ts                 - App entry, window creation, lifecycle
│   ├── vibe-kanban-manager.ts  - Child process spawning and event management
│   ├── port-detector.ts        - Extract port from vibe-kanban stdout
│   ├── health-checker.ts       - HTTP retry logic for server readiness
│   ├── menu.ts                 - App menu with update/help actions
│   ├── ipc/
│   │   └── handlers.ts         - IPC event handlers
│   └── updater/
│       ├── electron-updater.ts - GitHub Releases auto-update
│       └── vibe-kanban-updater.ts - npm registry version check
├── preload/
│   └── preload.ts              - Secure context bridge to renderer
├── renderer/
│   └── splash/index.html       - Loading screen
└── shared/
    └── types.ts                - IPC channels, app state types
build/
├── icon.svg                    - Source icon
├── icon.png / icon.icns / icon.ico - Platform icons
└── icons/                      - Multi-size PNGs
```

## Architecture

### Key Components

| Component | Description |
|-----------|-------------|
| VibeKanbanManager | EventEmitter managing `npx vibe-kanban@latest` child process |
| PortDetector | Regex pattern matching on stdout to extract `http://127.0.0.1:PORT` |
| HealthChecker | Retry logic using `electron.net.request` HEAD requests |
| Dual Updater | ElectronUpdater (GitHub) + VibeKanbanUpdater (npm) |

### Security

- `contextIsolation: true`
- `sandbox: true`
- `nodeIntegration: false`
- Navigation restricted to localhost only

## License

MIT
