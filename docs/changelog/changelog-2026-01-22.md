# Changelog - 2026-01-22

## vibe-kanban-desktop 프로젝트 초기 생성

### 추가된 기능

1. **프로젝트 구조**
   - Electron + TypeScript + Vite 기반 프로젝트 설정
   - electron-vite로 main/preload/renderer 빌드 구성
   - electron-builder로 macOS/Windows/Linux 크로스 플랫폼 빌드

2. **vibe-kanban 통합**
   - `VibeKanbanManager`: npx vibe-kanban@latest 자식 프로세스 관리
   - `PortDetector`: stdout에서 서버 포트 자동 감지 (정규식: `/http:\/\/127\.0\.0\.1:(\d+)/`)
   - `HealthChecker`: HTTP HEAD 요청으로 서버 준비 상태 확인

3. **이중 업데이트 시스템**
   - `ElectronUpdater`: GitHub Releases 기반 앱 자동 업데이트
   - `VibeKanbanUpdater`: npm registry에서 vibe-kanban 버전 확인

4. **UI/UX**
   - Splash 화면: 서버 시작 대기 중 표시
   - 메뉴 바: 업데이트 확인, 도움말 등

5. **보안**
   - contextIsolation: true
   - sandbox: true
   - nodeIntegration: false
   - localhost(127.0.0.1)만 내비게이션 허용

### 파일 구조

```
vibe-kanban-desktop/
├── src/
│   ├── main/
│   │   ├── main.ts
│   │   ├── vibe-kanban-manager.ts
│   │   ├── port-detector.ts
│   │   ├── health-checker.ts
│   │   ├── menu.ts
│   │   ├── ipc/handlers.ts
│   │   └── updater/
│   │       ├── electron-updater.ts
│   │       └── vibe-kanban-updater.ts
│   ├── preload/preload.ts
│   ├── renderer/splash/index.html
│   └── shared/types.ts
├── electron.vite.config.ts
├── electron-builder.yml
├── tsconfig.json
└── package.json
```

### 검증 완료

- TypeScript 타입 체크 통과
- ESLint 검사 통과
- electron-vite 빌드 성공

---

## 앱 아이콘 설정

### 변경 사항

1. **아이콘 파일 생성** (electron-icon-builder)
   - `build/icon.icns` - macOS용
   - `build/icon.ico` - Windows용
   - `build/icons/` - 다양한 크기의 PNG 파일들

2. **BrowserWindow 아이콘 설정**
   - `src/main/main.ts`: createMainWindow에 icon 속성 추가
   - 개발 모드에서도 커스텀 아이콘 표시

### 수정된 파일

- `src/main/main.ts` - BrowserWindow icon 속성 추가
- `build/icon.icns` - 새로 생성
- `build/icon.ico` - 새로 생성

---

## macOS Dock 아이콘 수정

### 문제

- macOS에서 `BrowserWindow.icon` 속성은 Dock 아이콘에 영향을 주지 않음
- 개발 모드 실행 시 Electron 기본 아이콘이 Dock에 표시됨

### 해결

- `app.dock.setIcon()` API를 사용하여 macOS Dock 아이콘 설정
- 개발 모드: `build/icon.png` 참조
- 패키징 모드: `process.resourcesPath`의 `icon.png` 참조

### 수정된 파일

- `src/main/main.ts` - bootstrap() 함수에 Dock 아이콘 설정 코드 추가
