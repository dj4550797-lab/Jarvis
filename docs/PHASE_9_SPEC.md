# Phase 9 Specification: Release and Windows Installer

## 1. Overview
Complies with `PLAN.md` Section 13, `JARVIS_Master_PRD.md` Section 28, and `docs/Implementation rule.md`:
- **Release Scope Freeze**: Version 0.1.0.
- **Production Frontend**: Built with Vite & React 18, generating optimized HTML/CSS/JS bundles in `frontend/dist`.
- **Packaged Python Backend**: Standalone Windows distribution packaged with PyInstaller into an executable runtime with all pinned dependencies.
- **Windows Installer Package**: Automated installer creating Desktop and Start Menu shortcuts, setting up per-user directory `%LOCALAPPDATA%\Programs\JARVIS`, configuring database in `%LOCALAPPDATA%\JARVIS`, and providing a full uninstaller.
- **Verification & Integrity**: SHA-256 checksum verification, offline/no-dev-server launch verification, persistence after restart, and graceful handling of missing optional model runtimes.

---

## 2. Release Components & Packaging Architecture
```
+--------------------------------------------------------------------------------+
|                        JARVIS v0.1.0 Release Package                           |
+--------------------------------------------------------------------------------+
|                                                                                |
|  [Installer Executable / Script]                                               |
|  ├── install.ps1          (Installs to %LOCALAPPDATA%\Programs\JARVIS)         |
|  ├── Setup-JARVIS.bat     (One-click double-clickable installer)               |
|  ├── uninstall.ps1        (Clean uninstallation with DB preservation option)   |
|  ├── checksums.sha256     (Cryptographic SHA-256 integrity manifest)          |
|  └── RELEASE_NOTES.md     (v0.1.0 Release Notes & Hardware Requirements)       |
|                                                                                |
|  [Application Distribution Directory: bin/]                                    |
|  ├── jarvis-backend.exe    (Compiled FastAPI backend with embedded runtime)    |
|  ├── jarvis-desktop.bat    (Headless application orchestrator launcher)        |
|  ├── dist/                 (Production React bundle: index.html, assets)       |
|  ├── alembic/              (Database migration files)                          |
|  └── alembic.ini           (Migration configuration)                           |
+--------------------------------------------------------------------------------+
```

---

## 3. Verification Criteria
1. **Real Installer Exists**: Packaged artifact generated in `dist/installer/`.
2. **Launches without Dev Server**: Application launches from installed location without `vite` or `python` dev server.
3. **Frontend/Backend Communication**: Native UI connects to `http://127.0.0.1:8000/api/v1/health` and displays healthy status.
4. **Data Persistence**: SQLite database stored in `%LOCALAPPDATA%\JARVIS\jarvis.db` persists across restarts.
5. **Missing Dependency Handling**: Missing local LLM (Ollama) or camera returns clear status (`not_configured`) rather than crashing.
6. **Integrity & Checksums**: SHA-256 checksums generated for all distributable binaries.
