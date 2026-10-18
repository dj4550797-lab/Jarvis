@echo off
setlocal
cd /d "%~dp0"

set "TARGET_URL=http://127.0.0.1:8000/app"
set "HEALTH_URL=http://127.0.0.1:8000/"

:: Check if server is already running
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri '%HEALTH_URL%' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if %ERRORLEVEL% equ 0 (
    echo [JARVIS] Assistant is already running. Opening Command Center UI...
    start "" "%TARGET_URL%"
    exit /b 0
)

echo [JARVIS] Starting JARVIS AI Assistant background service...
start "" /B "%~dp0jarvis-backend\jarvis-backend.exe"

echo [JARVIS] Waiting for JARVIS services to initialize...
powershell -NoProfile -Command "$ready = $false; for ($i=0; $i -lt 30; $i++) { try { $r = Invoke-WebRequest -Uri '%HEALTH_URL%' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { $ready = $true; break } } catch { Start-Sleep -Milliseconds 500 } }; if (-not $ready) { Write-Error 'Timeout waiting for JARVIS service'; exit 1 } else { exit 0 }"

if %ERRORLEVEL% equ 0 (
    echo [JARVIS] Online! Opening Command Center UI...
    start "" "%TARGET_URL%"
) else (
    echo [JARVIS ERROR] JARVIS service failed to start within timeout. Check logs in %%LOCALAPPDATA%%\JARVIS
    pause
)

exit /b 0
