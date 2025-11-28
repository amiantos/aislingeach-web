# Electron Desktop App Conversion Plan

## Overview

Convert Dreamers Guild into an Electron desktop application that packages the Express server and Vue frontend together as a single installable app. This will coexist with the existing web/Docker deployment as an alternate build target (similar to demo mode).

**Target Platforms:** macOS, Windows, Linux
**Auto-Updates:** Yes, using electron-updater with GitHub Releases

**Difficulty Assessment: Moderate** - The existing architecture is well-suited for this. The main work involves:
- Setting up Electron scaffolding
- Adapting server paths for user data folder
- Handling native module rebuilding
- Build configuration
- Auto-update integration

## Architecture

```
Electron App
├── Main Process (Node.js)
│   ├── Express Server (embedded)
│   ├── SQLite Database
│   └── Image Storage
│
└── Renderer Process (Chromium)
    └── Vue.js Frontend (loaded from Express)
```

The Express server runs on a dynamic localhost port in the main process. The Vue frontend loads in the Electron window and connects to this local server - identical to the current web setup, just packaged together.

## Tooling Choice: electron-builder

- Excellent native module support (critical for better-sqlite3 and sharp)
- Multi-platform builds from single config
- Built-in auto-update support
- Widely used with native dependencies

## Implementation Steps

### Phase 1: Setup (New Files)

1. **Create `/electron/main.js`** - Main process entry point
   - Create BrowserWindow
   - Start Express server on dynamic port (port 0)
   - Load Vue client from the Express server
   - Handle app lifecycle events
   - Set up userData paths before server starts

2. **Create `/electron/preload.js`** - Secure bridge to renderer
   - Expose server URL to renderer via contextBridge

### Phase 2: Server Adaptation

3. **Modify `/server/db/database.js`**
   - Accept configurable data directory
   - Fall back to current paths for standalone mode
   - Support Electron's `app.getPath('userData')` for:
     - macOS: `~/Library/Application Support/dreamers-guild`
     - Windows: `%APPDATA%/dreamers-guild`
     - Linux: `~/.config/dreamers-guild`

4. **Create `/server/electronServer.js`**
   - Export Express app without auto-starting listener
   - Provide `start(port)` and `stop()` methods
   - Accept dataDir configuration

### Phase 3: Build Configuration

5. **Update root `/package.json`**
   - Add dependencies: `electron`, `electron-builder`, `electron-rebuild`
   - Add postinstall hook for native module rebuilding
   - Add electron-builder configuration
   - Add scripts:
     - `dev:electron` - Development with Electron
     - `build:electron` - Build for current platform
     - `build:electron:mac/win/linux` - Platform-specific builds

6. **Update `/vue_client/vite.config.js`**
   - Add `VITE_ELECTRON_MODE` support (similar to demo mode)
   - Dynamic API base URL support

7. **Update `/vue_client/src/api/client.js`**
   - Support dynamic base URL from Electron preload

### Phase 4: Testing & Polish

8. Test on target platforms
9. Handle edge cases (port conflicts, permissions)

## Files to Modify

| File | Changes |
|------|---------|
| `/package.json` | Add Electron deps, scripts, builder config |
| `/server/db/database.js` | Configurable data paths |
| `/server/server.js` | Minor refactor for embedding |
| `/vue_client/vite.config.js` | Electron mode support |
| `/vue_client/src/api/client.js` | Dynamic base URL |
| `/.gitignore` | Add build outputs |

## New Files to Create

| File | Purpose |
|------|---------|
| `/electron/main.js` | Electron main process |
| `/electron/preload.js` | Secure IPC bridge |
| `/electron/updater.js` | Auto-update logic |
| `/server/electronServer.js` | Embeddable server wrapper |
| `.github/workflows/build-electron.yml` | CI/CD for releases (optional) |

## Key Challenges & Solutions

1. **Native Modules** - `better-sqlite3` and `sharp` need rebuilding
   - Solution: `electron-rebuild` as postinstall hook

2. **Port Conflicts** - Port 8005 might be in use
   - Solution: Use port 0 (OS assigns available port)

3. **File Paths** - Must work across platforms
   - Solution: Use `app.getPath('userData')` with `path.join()`

4. **macOS Code Signing** - Required for distribution
   - Solution: Configure electron-builder with signing (can defer to later)

## Auto-Update System

Uses `electron-updater` (part of electron-builder) with GitHub Releases as the update server.

**How it works:**
1. On app startup, check GitHub Releases for new version
2. If update available, show notification to user
3. Download update in background
4. Prompt user to restart to apply update

**New file: `/electron/updater.js`**
- Initialize autoUpdater
- Configure update checking interval
- Handle update events (checking, available, downloaded, error)
- Expose update status to renderer via IPC

**GitHub Releases workflow:**
- When you push a tag (e.g., `v1.0.0`), CI builds for all platforms
- Artifacts uploaded to GitHub Releases
- electron-updater automatically finds latest release

## Build Outputs

- **macOS**: `.dmg` installer, `.zip` for auto-updates
- **Windows**: NSIS installer, portable `.exe`
- **Linux**: AppImage, `.deb`

## NPM Scripts

```
npm run dev              # Existing web dev mode
npm run dev:electron     # Electron dev mode with hot reload
npm run build:electron   # Build for current platform
npm run build:electron:mac    # macOS builds
npm run build:electron:win    # Windows builds
npm run build:electron:linux  # Linux builds
npm run build:electron:all    # All platforms
```

## GitHub Actions (Optional CI/CD)

Create `.github/workflows/build-electron.yml` for automated builds:
- Trigger on version tags (v*)
- Build on macOS, Windows, Linux runners
- Upload to GitHub Releases
- Enables auto-update for end users

## Estimated Scope

- ~350-400 lines of new code (including auto-updater)
- ~50-100 lines of modifications to existing files
- New npm scripts and configuration
- Optional: CI/CD workflow for automated releases
