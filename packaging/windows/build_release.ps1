<#
.SYNOPSIS
    JARVIS Windows Standalone Release Builder
.DESCRIPTION
    Automates the entire build pipeline:
    1. Builds production React frontend with Vite.
    2. Packages standalone Python backend with PyInstaller.
    3. Bundles production UI, Alembic migrations, and launcher scripts into dist/installer/bin.
    4. Copies installer, uninstaller, and setup batch files.
    5. Generates SHA-256 integrity checksum manifest.
#>

[CmdletBinding()]
param ()

$ErrorActionPreference = "Stop"

$repoRoot = (Get-Item $PSScriptRoot).Parent.Parent.FullName
$frontendDir = Join-Path $repoRoot "frontend"
$backendDir = Join-Path $repoRoot "backend"
$distDir = Join-Path $repoRoot "dist\installer"
$binDir = Join-Path $distDir "bin"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         JARVIS Windows Release Build Pipeline            " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Build Frontend
Write-Host "[1/5] Building production React bundle (Vite)..." -ForegroundColor Yellow
Push-Location $frontendDir
try {
    npm run build
} finally {
    Pop-Location
}

# 2. Package Backend with PyInstaller
Write-Host "[2/5] Packaging Python backend runtime (PyInstaller)..." -ForegroundColor Yellow
Push-Location $backendDir
try {
    $venvPyInstaller = Join-Path $repoRoot ".venv\Scripts\pyinstaller.exe"
    if (Test-Path $venvPyInstaller) {
        & $venvPyInstaller --name jarvis-backend --onedir --noconfirm --clean run_server.py
    } else {
        pyinstaller --name jarvis-backend --onedir --noconfirm --clean run_server.py
    }
} finally {
    Pop-Location
}

# 3. Assemble installer distribution
Write-Host "[3/5] Assembling installer package in $distDir..." -ForegroundColor Yellow
if (Test-Path $distDir) {
    Remove-Item -Path $distDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $binDir | Out-Null

# Copy PyInstaller output
Copy-Item -Path (Join-Path $backendDir "dist\jarvis-backend") -Destination $binDir -Recurse -Force

# Copy Frontend dist into jarvis-backend
Copy-Item -Path (Join-Path $frontendDir "dist") -Destination (Join-Path $binDir "jarvis-backend\dist") -Recurse -Force

# Copy Alembic migrations
Copy-Item -Path (Join-Path $backendDir "alembic") -Destination $binDir -Recurse -Force
Copy-Item -Path (Join-Path $backendDir "alembic.ini") -Destination (Join-Path $binDir "alembic.ini") -Force

# Copy scripts from packaging directory
Copy-Item -Path (Join-Path $PSScriptRoot "Setup-JARVIS.bat") -Destination $distDir -Force
Copy-Item -Path (Join-Path $PSScriptRoot "install.ps1") -Destination $distDir -Force
Copy-Item -Path (Join-Path $PSScriptRoot "uninstall.ps1") -Destination $distDir -Force
Copy-Item -Path (Join-Path $PSScriptRoot "RELEASE_NOTES.md") -Destination $distDir -Force
Copy-Item -Path (Join-Path $PSScriptRoot "jarvis-desktop.bat") -Destination $binDir -Force
Copy-Item -Path (Join-Path $PSScriptRoot "jarvis-stop.bat") -Destination $binDir -Force
Copy-Item -Path (Join-Path $PSScriptRoot "uninstall.ps1") -Destination $binDir -Force

# 4. Generate SHA-256 Checksums
Write-Host "[4/5] Generating SHA-256 integrity manifest..." -ForegroundColor Yellow
$checksumFiles = @(
    "Setup-JARVIS.bat",
    "install.ps1",
    "uninstall.ps1",
    "RELEASE_NOTES.md",
    "bin\jarvis-desktop.bat",
    "bin\jarvis-stop.bat",
    "bin\jarvis-backend\jarvis-backend.exe",
    "bin\jarvis-backend\dist\index.html"
)
$manifestLines = [System.Collections.Generic.List[string]]::new()
foreach ($file in $checksumFiles) {
    $fullPath = Join-Path $distDir $file
    if (Test-Path $fullPath) {
        $hash = (Get-FileHash -Path $fullPath -Algorithm SHA256).Hash.ToLower()
        $manifestLines.Add("$hash  $file")
    }
}
$checksumFile = Join-Path $distDir "checksums.sha256"
[System.IO.File]::WriteAllLines($checksumFile, $manifestLines, [System.Text.Encoding]::UTF8)

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "       JARVIS Windows Release Build Complete!             " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Distribution Directory: $distDir"
Write-Host "Manifest generated at: $checksumFile"
