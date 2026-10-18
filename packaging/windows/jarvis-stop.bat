@echo off
setlocal
echo [JARVIS] Stopping JARVIS AI Assistant processes...
taskkill /F /IM jarvis-backend.exe >nul 2>&1
echo [JARVIS] All JARVIS background services stopped.
exit /b 0
