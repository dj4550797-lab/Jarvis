# TROUBLESHOOTING.md — Diagnostics & Issue Resolution Guide

This guide provides step-by-step diagnostic procedures and verified resolutions for common setup, runtime, and platform issues encountered when running **JARVIS**.

---

## 1. Quick Diagnostic Checklist

Before proceeding to specific issues, run the built-in diagnostic checks:
1. Verify backend health endpoint: `curl http://127.0.0.1:8000/api/v1/health`
2. Inspect log files: `tail -n 100 backend/logs/jarvis.log`
3. Verify SQLite database integrity: `python -m jarvis.database.migrate status`

---

## 2. Common Issues & Resolutions

### 2.1 Backend Port 8000 Already in Use
**Symptom:** Backend fails to boot with `[Errno 10048] error while attempting to bind on address ('127.0.0.1', 8000)`.  
**Resolution:**
1. Identify the process holding port 8000:
   ```powershell
   Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess
   ```
2. Terminate the stale process or configure a different port in `.env`:
   ```ini
   JARVIS_PORT=8010
   ```

### 2.2 PowerShell Script Execution Policy Error
**Symptom:** Activating virtual environment fails with `cannot be loaded because running scripts is disabled on this system`.  
**Resolution:**
Execute in PowerShell with process-scoped execution policy:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\.venv\Scripts\Activate.ps1
```

### 2.3 Cargo / Rust Not Found for Tauri Builds
**Symptom:** `npm run tauri dev` or `npm run tauri build` reports `cargo : The term 'cargo' is not recognized`.  
**Resolution:**
- Install the official Rust toolchain via [rustup.rs](https://rustup.rs).
- Ensure `C:\Users\<user>\.cargo\bin` is added to system PATH.
- *Workaround during UI development:* You can run and test the frontend in web mode using `npm run dev` at `http://localhost:5173`.

### 2.4 SQLite Database Is Locked (`database is locked`)
**Symptom:** Concurrent requests fail with database busy errors.  
**Resolution:**
- Confirm WAL mode is enabled:
  ```sql
  PRAGMA journal_mode=WAL;
  PRAGMA busy_timeout=5000;
  ```
- Ensure connection pool is using a single write connection with multiple read sessions as specified in `data.md`.

### 2.5 Local AI Model Out of Memory (OOM)
**Symptom:** Loading a GGUF model crashes or throws `CUDA out of memory` / `Failed to allocate RAM`.  
**Resolution:**
- Open **Local Models** view in dashboard.
- Select a quantized model appropriate for your available physical memory:
  - 8GB RAM: Use 3B to 7B models quantized to Q4_K_M (requires ~4.5GB RAM).
  - 16GB RAM: Use 7B to 8B models quantized to Q5_K_M or Q8_0.
- Switch to CPU inference mode if your GPU VRAM is insufficient.

### 2.6 Microphone / Speech Input Not Recognized
**Symptom:** Voice state machine remains in `Idle` or reports `Audio device unavailable`.  
**Resolution:**
- Windows Settings -> Privacy & Security -> Microphone: Ensure "Let desktop apps access your microphone" is set to **On**.
- Inspect audio devices in Settings -> Voice -> Audio Input Selector.
