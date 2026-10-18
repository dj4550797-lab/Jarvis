# JARVIS Windows Packaging & Installer Infrastructure

This directory contains the packaging automation, installation scripts, and configuration for releasing the standalone Windows distribution of **JARVIS Personal AI Assistant**.

---

## Directory Contents

| File | Purpose |
|---|---|
| `build_release.ps1` | Orchestrates the full release build: builds frontend (`Vite`), packages backend (`PyInstaller`), assembles distribution files, and computes SHA-256 hashes. |
| `Setup-JARVIS.bat` | One-click, double-clickable Windows batch installer for end users. |
| `install.ps1` | Core PowerShell installation engine deploying files to `%LOCALAPPDATA%\Programs\JARVIS`, creating Desktop/Start Menu shortcuts, and registering uninstallation metadata. |
| `uninstall.ps1` | Clean uninstaller stopping running processes, removing shortcuts/registry entries, and safely preserving the user SQLite database in `%LOCALAPPDATA%\JARVIS` by default. |
| `jarvis-desktop.bat` | Smart application launcher verifying whether the backend is already running before opening the Command Center UI. |
| `jarvis-stop.bat` | Gracefully terminates background JARVIS services. |
| `RELEASE_NOTES.md` | Hardware requirements, architecture highlights, and installation guide. |
| `checksums.sha256` | Cryptographic SHA-256 integrity manifest for all released files. |

---

## How to Build the Release Package

From the repository root in PowerShell:
```powershell
.\packaging\windows\build_release.ps1
```

The output distribution package will be assembled in:
```
dist/installer/
├── Setup-JARVIS.bat
├── install.ps1
├── uninstall.ps1
├── RELEASE_NOTES.md
├── checksums.sha256
└── bin/
    ├── jarvis-backend/
    │   ├── jarvis-backend.exe
    │   ├── _internal/
    │   └── dist/ (Vite React bundle)
    ├── alembic/
    ├── alembic.ini
    ├── jarvis-desktop.bat
    └── jarvis-stop.bat
```
