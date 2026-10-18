@echo off
setlocal
cd /d "%~dp0"
echo ==========================================================
echo            JARVIS v0.1.0 Windows Setup Wizard             
echo ==========================================================
echo Starting installation...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" %*
if %ERRORLEVEL% equ 0 (
    echo.
    echo Setup completed successfully!
) else (
    echo.
    echo [ERROR] Installation encountered an issue. See above for details.
)
echo Press any key to exit setup...
pause >nul
exit /b %ERRORLEVEL%
