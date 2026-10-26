# RELEASE.md — Release Protocol, Gates & Artifact Specifications

This document defines the strict release criteria, artifact packaging specifications, checksum generation, and verification gates required before any build of **JARVIS** can be marked as a release candidate.

---

## 1. Deliverable Artifact Specifications

Per the PRD Final Requirement, end users must never be expected to compile code, assemble dependencies, or install Python/Node.js manually.

### 1.1 Windows Desktop Deliverable: `JARVIS-Setup.exe`
- **Output Name:** `JARVIS-Setup.exe`
- **Architecture:** x86_64 Windows 10/11
- **Bundled Contents:**
  - Tauri 2 native desktop executable wrapper.
  - Production compiled React 19 web assets.
  - Embedded Python runtime environment with all compiled wheels.
  - Pre-migrated baseline SQLite database templates.
  - Local speech and inference native driver libraries.
- **Verification:**
  - File exists and is non-zero in size.
  - Generates valid SHA-256 checksum recorded in release manifest.
  - Installs cleanly to `Program Files` or user local app data without developer prompts.
  - Launches to Home Dashboard on fresh clean Windows VM.

### 1.2 Android Mobile Deliverable: `JARVIS.apk`
- **Output Name:** `JARVIS.apk`
- **Packaging Type:** Single, universal APK (NOT split APKs, XAPK, or Gradle projects).
- **Architecture:** Universal ARM64-v8a + armeabi-v7a.
- **Bundled Contents:**
  - Kotlin + Jetpack Compose compiled DEX code.
  - Embedded Room persistence layer.
  - Asset catalog and offline model downloader.
- **Verification:**
  - Verified with `apksigner verify --verbose JARVIS.apk`.
  - Installs via single tap on physical Android 12+ device or emulator.
  - First-launch onboarding executes and requests permissions transparently.

---

## 2. Release Gates & Definition of Done

A build is certified for release **only** when all the following gates pass:

1. **Clean Automated Test Suite:**
   - 100% of unit tests in `backend/tests/unit` pass.
   - 100% of integration tests in `backend/tests/integration` pass.
   - Frontend `npm run typecheck` and Vitest suites pass with zero warnings.
2. **Offline 12-Step Acceptance Test:**
   - The 12-step offline protocol defined in `test.md` passes on physical test hardware without an internet connection.
3. **Zero-Fabrication Audit:**
   - All 32 pages verified to connect to real backend telemetry.
   - No mock buttons, dummy toasts, or canned model responses in production build.
4. **Security & Vulnerability Scan:**
   - No high or critical severity CVEs in Python or Node dependencies.
   - No hardcoded credentials or private keys in the repository.
5. **Documentation Parity:**
   - `CHANGELOG.md` updated with release version and date.
   - `memory.md` and `task.md` synchronized.

---

## 3. Release Verification Checklist

- [ ] Build `JARVIS-Setup.exe`.
- [ ] Calculate and record SHA-256 hash: `Get-FileHash -Algorithm SHA256 JARVIS-Setup.exe`.
- [ ] Build `JARVIS.apk`.
- [ ] Calculate and record SHA-256 hash: `Get-FileHash -Algorithm SHA256 JARVIS.apk`.
- [ ] Perform fresh install on clean test machine.
- [ ] Verify offline mode boot and local model response.
- [ ] Sign git release tag: `git tag -s v<version> -m "Release v<version>"`.
