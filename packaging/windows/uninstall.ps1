<#
.SYNOPSIS
    JARVIS Personal AI Assistant Uninstaller
.DESCRIPTION
    Removes the JARVIS application from %LOCALAPPDATA%\Programs\JARVIS, cleans up desktop
    and Start menu shortcuts, and removes registry entries. By default, user data in
    %LOCALAPPDATA%\JARVIS is preserved unless -PurgeData is specified.
#>

[CmdletBinding()]
param (
    [switch]$PurgeData,
    [switch]$Silent
)

$ErrorActionPreference = "Continue"

$installDir = Join-Path $env:LOCALAPPDATA "Programs\JARVIS"
$dataDir = Join-Path $env:LOCALAPPDATA "JARVIS"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "        JARVIS Personal AI Assistant Uninstallation       " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Stop running processes
Write-Host "[1/4] Stopping running JARVIS processes..." -ForegroundColor Yellow
$procs = Get-Process -Name "jarvis-backend" -ErrorAction SilentlyContinue
if ($procs) {
    $procs | Stop-Process -Force
    Start-Sleep -Seconds 1
}

# 2. Remove Shortcuts
Write-Host "[2/4] Removing Desktop and Start Menu shortcuts..." -ForegroundColor Yellow
$desktopLnk = Join-Path ([Environment]::GetFolderPath("Desktop")) "JARVIS.lnk"
if (Test-Path $desktopLnk) {
    Remove-Item -Path $desktopLnk -Force -ErrorAction SilentlyContinue
}

$startMenuLnk = Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs\JARVIS.lnk"
if (Test-Path $startMenuLnk) {
    Remove-Item -Path $startMenuLnk -Force -ErrorAction SilentlyContinue
}

# 3. Remove Registry keys
Write-Host "[3/4] Removing registry uninstall registration..." -ForegroundColor Yellow
$regKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\JARVIS"
if (Test-Path $regKey) {
    Remove-Item -Path $regKey -Recurse -Force -ErrorAction SilentlyContinue
}

# 4. Remove installation files
Write-Host "[4/4] Removing installed program files..." -ForegroundColor Yellow
if (Test-Path $installDir) {
    # Remove bin files
    $binDir = Join-Path $installDir "bin"
    if (Test-Path $binDir) {
        Remove-Item -Path $binDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

if ($PurgeData) {
    Write-Host "[*] Purging persistent database and user data in $dataDir..." -ForegroundColor Yellow
    if (Test-Path $dataDir) {
        Remove-Item -Path $dataDir -Recurse -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "[i] User database preserved in: $dataDir" -ForegroundColor Cyan
    Write-Host "    (Use -PurgeData switch to delete application database and memories)" -ForegroundColor Gray
}

# Clean up parent directory if empty
try {
    if (Test-Path $installDir) {
        Remove-Item -Path $installDir -Recurse -Force -ErrorAction SilentlyContinue
    }
} catch {
    # Ignored if currently running script from within installDir
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "          JARVIS Has Been Successfully Uninstalled        " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
