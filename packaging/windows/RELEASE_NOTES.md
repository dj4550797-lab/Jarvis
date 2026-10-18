# JARVIS Personal AI Assistant — Release Notes v0.1.0

**Release Date:** October 2026  
**Version:** 0.1.0 (MVP Release)  
**Target Operating System:** Microsoft Windows 10 / 11 (x86-64)

---

## 1. Executive Summary

JARVIS v0.1.0 is a fully local, privacy-first personal AI assistant engineered for Windows. Operating strictly on the local loopback interface (`127.0.0.1:8000`), JARVIS requires zero mandatory cloud connectivity, keeping user memories, device control, and conversations entirely under user control.

---

## 2. Capabilities & Milestones Completed

### Phase 1: Local Foundation & Resilient Infrastructure
- Production-grade FastAPI backend bound strictly to `127.0.0.1:8000`.
- SQLite database configured with Write-Ahead Logging (`PRAGMA journal_mode=WAL`) and foreign key enforcement (`PRAGMA foreign_keys=ON`).
- Data directory automatically resolved to `%LOCALAPPDATA%\JARVIS\jarvis.db` on Windows.
- Standardized API health diagnostics endpoint at `/api/v1/health`.

### Phase 2: Reactive Command Center UI
- High-performance web interface built with React 18, TypeScript, and Vite.
- Curated sci-fi dark command center aesthetic with vibrant cyan/blue neon accents, dynamic animations, and responsive layout.
- Real-time hardware telemetry display (CPU, RAM, Disk, System uptime).
- Live log streaming and agent state indicators.

### Phase 3: Conversational Core & Two-Tier Memory
- Multi-session chat system with persistent SQLite storage.
- Two-tier memory architecture: short-term rolling conversation context and long-term persistent semantic memory.
- Automatic memory retrieval and prompt augmentation with relevance scoring.

### Phase 4: Autonomous Task Execution & Background Job Queue
- Background task executor running async worker threads without blocking API responsiveness.
- Task lifecycle management (Pending, Running, Completed, Failed, Cancelled) with real-time progress reporting.
- Built-in task types including system diagnostics, simulation, and file indexing.

### Phase 5: Voice Pipeline
- Kokoro-82M ONNX local neural text-to-speech (TTS) engine delivering natural voice responses.
- Whisper speech-to-text (STT) pipeline with microphone audio capture.
- Real-time audio waveform visualizer and speech synthesis player in the UI.

### Phase 6: Computer Vision Engine
- OpenCV-powered local camera integration supporting live preview, camera selection, and snapshot captures.
- Vision analysis pipeline for scene description and visual query answering.
- Graceful degradation on headless systems or environments lacking a connected camera.

### Phase 7: Context-Aware Desktop Integration & System Controls
- Windows native system controls including master audio volume adjustment and application launching.
- Secure path validation preventing arbitrary executable execution outside allowed programs.
- Real-time Windows hardware monitoring via `psutil`.

### Phase 8: Autonomous Multi-Agent Orchestration & Tool Sandbox
- Specialized multi-agent system comprising CodeAnalyzer, WebResearcher, and SystemAdmin subagents.
- Agent orchestrator capable of decomposing complex goals into coordinated subtasks.
- Sandboxed tool execution environment with strict argument validation and timeout controls.

### Phase 9: Windows Installer & Release Packaging
- Standalone PyInstaller executable distribution (`jarvis-backend.exe`) embedding all Python dependencies into an isolated runtime.
- Pre-built production React bundle served directly from the backend server on `/app`.
- One-click Windows installer (`Setup-JARVIS.bat`, `install.ps1`) targeting `%LOCALAPPDATA%\Programs\JARVIS`.
- Desktop and Start Menu shortcut generation.
- Windows Add/Remove Programs registry integration.
- Clean uninstaller (`uninstall.ps1`) preserving user databases and memories by default.
- Cryptographic SHA-256 integrity manifest (`checksums.sha256`).

---

## 3. System Requirements

| Requirement | Minimum Specification | Recommended Specification |
|---|---|---|
| **Operating System** | Windows 10 (64-bit, 20H2+) | Windows 11 (64-bit) |
| **Processor** | Intel Core i3 / AMD Ryzen 3 (2 cores) | Intel Core i5 / AMD Ryzen 5 (4+ cores) |
| **Memory (RAM)** | 4 GB | 8 GB or higher |
| **Storage** | 1 GB free space | 5 GB free space (with local LLM weights) |
| **Network** | Offline supported | Optional internet access for web research |
| **Optional Peripherals** | Webcam (for vision), Microphone (for voice) | USB headset / webcam |

---

## 4. Installation & Quick Start

1. **Download & Extract**: Extract the `JARVIS-v0.1.0-Windows.zip` package to any local folder.
2. **Run Installer**: Double-click `Setup-JARVIS.bat` (or execute `powershell -ExecutionPolicy Bypass -File install.ps1`).
3. **Launch**: Double-click the **JARVIS** shortcut created on your Desktop or Start Menu.
4. **Access**: The Command Center UI will open automatically in your browser at `http://127.0.0.1:8000/app`.

---

## 5. Uninstallation

To remove JARVIS:
- Open Windows **Settings > Apps > Installed apps**, locate **JARVIS Personal AI Assistant**, and click **Uninstall**.
- Alternatively, run `powershell -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\Programs\JARVIS\uninstall.ps1"`.
- *Note:* Your database and memory history in `%LOCALAPPDATA%\JARVIS` are preserved unless the `-PurgeData` flag is explicitly provided.
