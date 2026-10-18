<#
.SYNOPSIS
    JARVIS Personal AI Assistant Windows Installer
.DESCRIPTION
    Installs the standalone JARVIS v0.1.0 application package into %LOCALAPPDATA%\Programs\JARVIS,
    configures persistent data storage in %LOCALAPPDATA%\JARVIS, creates desktop and Start menu
    shortcuts, and registers the uninstaller.
#>

[CmdletBinding()]
param (
    [switch]$LaunchAfterInstall,
    [switch]$Silent
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$installDir = Join-Path $env:LOCALAPPDATA "Programs\JARVIS"
$dataDir = Join-Path $env:LOCALAPPDATA "JARVIS"
$binSourceDir = Join-Path $scriptDir "bin"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         JARVIS Personal AI Assistant v0.1.0 Setup        " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1/5] Target directories:" -ForegroundColor Yellow
Write-Host "  - Installation: $installDir"
Write-Host "  - Persistent Data: $dataDir"

# Stop existing running instance if any
$running = Get-Process -Name "jarvis-backend" -ErrorAction SilentlyContinue
if ($running) {
    Write-Host "[*] Stopping running JARVIS backend instance..." -ForegroundColor Yellow
    $running | Stop-Process -Force
    Start-Sleep -Seconds 1
}

# Ensure directories exist
Write-Host "[2/5] Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $installDir | Out-Null
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $installDir "bin") | Out-Null

# Copy binary package
Write-Host "[3/5] Deploying application binaries and UI bundle..." -ForegroundColor Yellow
Copy-Item -Path "$binSourceDir\*" -Destination (Join-Path $installDir "bin") -Recurse -Force

# Copy uninstaller script to installation folder
$uninstallSrc = Join-Path $scriptDir "uninstall.ps1"
if (Test-Path $uninstallSrc) {
    Copy-Item -Path $uninstallSrc -Destination (Join-Path $installDir "uninstall.ps1") -Force
}

# Create shortcuts
Write-Host "[4/5] Creating Desktop and Start Menu shortcuts..." -ForegroundColor Yellow
$wsh = New-Object -ComObject WScript.Shell

# Desktop shortcut
$desktopDir = [Environment]::GetFolderPath("Desktop")
$desktopLnk = Join-Path $desktopDir "JARVIS.lnk"
$shortcut = $wsh.CreateShortcut($desktopLnk)
$shortcut.TargetPath = Join-Path $installDir "bin\jarvis-desktop.bat"
$shortcut.WorkingDirectory = Join-Path $installDir "bin"
$shortcut.Description = "JARVIS Personal AI Assistant"
$shortcut.Save()

# Start menu shortcut
$startMenuDir = Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs"
$startMenuLnk = Join-Path $startMenuDir "JARVIS.lnk"
$shortcut = $wsh.CreateShortcut($startMenuLnk)
$shortcut.TargetPath = Join-Path $installDir "bin\jarvis-desktop.bat"
$shortcut.WorkingDirectory = Join-Path $installDir "bin"
$shortcut.Description = "JARVIS Personal AI Assistant"
$shortcut.Save()

# Windows Registry entry for Add/Remove Programs
Write-Host "[5/5] Registering installation metadata..." -ForegroundColor Yellow
$regKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\JARVIS"
if (-not (Test-Path $regKey)) {
    New-Item -Path $regKey -Force | Out-Null
}
Set-ItemProperty -Path $regKey -Name "DisplayName" -Value "JARVIS Personal AI Assistant"
Set-ItemProperty -Path $regKey -Name "DisplayVersion" -Value "0.1.0"
Set-ItemProperty -Path $regKey -Name "Publisher" -Value "JARVIS AI"
Set-ItemProperty -Path $regKey -Name "InstallLocation" -Value $installDir
Set-ItemProperty -Path $regKey -Name "UninstallString" -Value "powershell.exe -ExecutionPolicy Bypass -File `"$installDir\uninstall.ps1`""
Set-ItemProperty -Path $regKey -Name "NoModify" -Value 1 -Type DWord
Set-ItemProperty -Path $regKey -Name "NoRepair" -Value 1 -Type DWord

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "       JARVIS v0.1.0 Installation Completed Successfully! " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Shortcuts created on Desktop and Start Menu."
Write-Host "Run JARVIS anytime by double-clicking the Desktop shortcut."
Write-Host ""

if ($LaunchAfterInstall) {
    Write-Host "Launching JARVIS..." -ForegroundColor Cyan
    Start-Process -FilePath (Join-Path $installDir "bin\jarvis-desktop.bat")
}
