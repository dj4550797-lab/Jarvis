JARVIS — Windows Release & Deployment Guide

Document: "RELEASE.md"
Application: JARVIS Desktop Assistant
Target platform: Windows 10/11, x64
Desktop framework: Tauri 2
Frontend: React + TypeScript + Vite
Backend: Python + FastAPI
Database: SQLite + SQLAlchemy 2.x + Alembic
Status: Release engineering specification

---

1. Purpose

This document defines the repeatable process for building, packaging, signing, testing, publishing, upgrading, and rolling back JARVIS Windows releases.

Every release must be:

- Reproducible from a known source revision.
- Packaged with the required frontend, backend, runtime dependencies, and resources.
- Tested on a clean Windows environment.
- Verified for installation, startup, core features, upgrade, and uninstall.
- Accompanied by traceable build artifacts, checksums, test results, and release notes.
- Safe for existing user data and database migrations.

Release rule: A successful compilation alone does not mean the application is ready for release.

2. Release architecture

Expected deployment architecture:

JARVIS Windows Installer
          |
          v
Tauri 2 Desktop Application
          |
          +--> React / TypeScript / Vite UI
          |
          +--> Rust desktop host
                    |
                    +--> Starts managed Python backend
                    |
                    +--> Monitors backend lifecycle
                    |
                    +--> Handles desktop permissions
                              |
                              v
                     Python FastAPI Backend
                              |
                  +-----------+-----------+
                  |           |           |
                  v           v           v
               SQLite      AI APIs     Voice services
               database    optional    optional

2.1 Recommended backend packaging strategy

Choose and document exactly one strategy before implementing the release pipeline.

Option A — Standalone backend executable

- Package the Python application using PyInstaller or an equivalent approved packager.
- Include required Python modules, native libraries, templates, static files, migration files, and other runtime resources.
- Prefer a one-folder deployment when it makes resource paths and native dependency troubleshooting more reliable.
- Launch the backend as a managed child process from the Tauri host.
- Verify that the generated executable works without a Python installation.

Option B — Bundled Python runtime

- Ship a supported Python runtime and the application's installed dependencies.
- Launch the backend through the bundled interpreter.
- Resolve all runtime paths relative to the installed application.
- Verify DLLs, native extensions, package imports, and runtime initialization on a clean machine.

Do not silently switch between these strategies across releases.

2.2 Backend process contract

The packaged backend must have a documented contract covering:

- Executable path and working directory.
- Startup arguments and environment variables.
- Local binding address and port allocation.
- Health-check endpoint and expected response.
- Startup timeout and readiness detection.
- Standard output, standard error, and log locations.
- Graceful shutdown and process cleanup.
- Restart policy and maximum retry count.
- Exit codes and error reporting.
- Database and migration resource paths.

The backend must not be treated as ready merely because its process exists. The desktop host should wait for a successful health check before enabling backend-dependent UI features.

Bind the backend to loopback by default. Do not expose a local API to the LAN or public internet unless the approved architecture explicitly requires it and includes authentication and appropriate network protections.

2.3 Port allocation

If a fixed local port is used, define the port and its collision behavior in the implementation documentation. If an ephemeral port is used, define how the desktop host securely discovers it.

Do not assume a port is available without checking. A port collision must produce a clear diagnostic message, not an unexplained blank screen.

3. Versioning and release identity

Use Semantic Versioning where practical:

- "MAJOR": incompatible product or data-format changes.
- "MINOR": backward-compatible functionality.
- "PATCH": backward-compatible fixes.

Example: "1.4.2".

Each release must identify:

Field| Required value
Product version| Exact release version
Source revision| Full Git commit SHA
Source branch/tag| Protected release tag
Build target| Windows architecture, such as x64
Build environment| OS and toolchain versions
Backend version| Version included in the installer
Database schema| Current Alembic revision
Installer format| NSIS, MSI, or another explicitly selected format
Signing identity| Certificate subject and thumbprint, if signed
Build timestamp| Recorded in UTC
Release status| Draft, candidate, approved, or withdrawn

The application version, installer version, backend version, and displayed About-dialog version must not contradict one another.

4. Build prerequisites

Prepare a dedicated Windows build machine or controlled CI runner.

4.1 Required tooling

Install and verify the versions supported by the actual repository:

- Windows 10/11 x64 or a supported Windows CI image.
- Git.
- Node.js LTS compatible with the project's lockfile and toolchain.
- npm, pnpm, or Yarn matching the repository's chosen package manager.
- Rust stable toolchain and the Windows MSVC target.
- Visual Studio Build Tools with the required C++ build tools and Windows SDK.
- WebView2 Runtime or the appropriate supported deployment arrangement.
- Python version supported by the application.
- Backend dependency/build tooling, such as pip and PyInstaller, if selected.
- Tauri CLI and project-specific build dependencies.
- Windows signing tools, if signing is part of the release.

Do not install multiple conflicting package managers or regenerate lockfiles casually during a release build.

4.2 Environment verification

Run from PowerShell:

git --version
node --version
npm --version
rustc --version
cargo --version
py --version

For projects using npm, confirm the expected lockfile exists:

Test-Path .\package-lock.json

For a Visual Studio Build Tools installation, verify that the required compiler and Windows SDK are installed. Use the appropriate Visual Studio Developer PowerShell when necessary.

For Rust, verify the required target:

rustup show
rustup target list --installed

The exact required Rust target depends on the configured build environment. Do not install a target solely because it appears in an example.

4.3 Environment and secret handling

- Use a dedicated release environment.
- Never commit API keys, signing passwords, private keys, personal credentials, or production user data.
- Store signing secrets in an approved secret manager or protected CI secrets.
- Keep developer ".env" files out of the installer unless a specific non-secret configuration file is intentionally required.
- Do not bundle a developer's personal AI provider credentials.
- Test with dummy credentials or controlled test accounts.
- Record dependency versions and toolchain versions for each release.

5. Source preparation

Start from a clean, reviewed repository.

git status --short
git fetch --tags
git log -1 --oneline

Check the intended release tag and commit. For a release candidate, use a dedicated candidate tag or an unambiguous build identifier.

Before building:

1. Review the changes since the previous release.
2. Confirm code review and required approvals.
3. Check the dependency lockfiles.
4. Confirm the database migration chain is complete.
5. Check for accidental secrets and local configuration.
6. Confirm all required icons, licenses, assets, and resource files exist.
7. Confirm the documented Python and Node.js versions are supported.
8. Confirm no uncommitted source changes are included accidentally.

Do not create a release tag on a commit that has not passed the project's required checks.

6. Dependency installation and validation

Use the repository's documented commands. The following are examples for an npm-based frontend.

npm ci

"npm ci" should use the committed lockfile and fail if the dependency manifest and lockfile are inconsistent.

For the Python backend, activate the documented build environment and install the locked dependencies. If a requirements file is used:

py -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

For release builds, dependencies should be pinned or resolved through a controlled lock mechanism. Upgrade dependencies deliberately, not during the release build.

Run the project's available validation commands:

npm run

Use the actual repository scripts for linting, type checking, tests, and frontend compilation. Do not assume every project has the same script names.

For Python:

.\.venv\Scripts\python.exe -m pip check

Then run the documented backend tests.

Pass criteria: dependencies install successfully, no unresolved dependency conflicts remain, and required tests pass.

7. Frontend production build

The production frontend must use production configuration and must not point to a developer machine or development server.

Verify:

- Production API configuration is applied.
- No development-only debug endpoints are exposed.
- Required assets are included.
- UI startup does not depend on a Vite development server.
- Runtime configuration is not hardcoded to a developer's URL.
- Frontend and backend versions are compatible.

Build with the repository's production build command, for example:

npm run build

Verify the configured output directory exists:

Test-Path .\dist

The output directory may differ if Vite is configured differently.

Do not package a development build as a production release.

8. Python backend packaging

8.1 Build preparation

Before packaging:

1. Activate the approved build environment.
2. Install locked runtime and build dependencies.
3. Run unit and integration tests.
4. Confirm migration files and required resource directories are included.
5. Check all native Python extensions and DLL dependencies.
6. Confirm the backend starts without relying on the source repository.
7. Verify no local database or test user data is included.

8.2 Standalone executable build

If PyInstaller is selected, use the reviewed ".spec" file or documented packaging configuration. A generic command may look like:

.\.venv\Scripts\python.exe -m PyInstaller --clean .\jarvis_backend.spec

This is an illustrative command: use it only if the project actually contains the named specification file.

Do not assume PyInstaller automatically detects every required dynamic import, template, migration, certificate, native library, or data file.

8.3 Backend package validation

Test the generated backend artifact directly:

- Start it outside the source repository.
- Confirm its working directory does not need to be the repository root.
- Verify that all resources resolve from packaged locations.
- Confirm its health endpoint becomes ready.
- Confirm expected API routes respond.
- Confirm graceful shutdown works.
- Confirm no development server or unrelated process is required.
- Check logs for missing modules and resource paths.
- Confirm database files are created in the intended per-user data directory, not inside a read-only installation directory.

If the backend cannot run without the source tree, Python installed on the build machine, or developer environment variables, packaging is incomplete.

9. Tauri 2 packaging

9.1 Configuration review

Review the project's Tauri configuration, typically "src-tauri/tauri.conf.json" or the repository's equivalent.

Verify:

- Application identifier remains stable across compatible releases.
- Product name and version are correct.
- Frontend production assets are configured correctly.
- Windows bundle targets are explicitly selected.
- Icons and installer metadata are correct.
- Capabilities and permissions follow least privilege.
- External binaries or sidecars are declared and included correctly.
- Installer scope and install mode match the intended distribution.
- Resource paths are compatible with packaged execution.
- No development-only settings remain enabled.

Do not change the application identifier casually; doing so can cause the installer to treat an upgrade as a separate application.

9.2 Backend inclusion

Use the repository's approved integration method to include the backend artifact and its runtime resources. Tauri sidecar configuration, bundled resources, and an application-managed child process are possible approaches; choose the method actually implemented.

Verify the final installer contains every required file. Confirm:

- Backend executable or runtime is present.
- Required resource files and migrations are present.
- Backend is launched from the installed path.
- Child processes are shut down when JARVIS exits.
- No path relies on the build machine's temporary directories.
- The installed app does not attempt to execute source files from the developer checkout.

9.3 Installer build

Run the repository's documented Tauri production build command. A common example is:

npm run tauri build

Use this command only if the repository defines the corresponding script.

Tauri may produce different installer formats depending on configuration and target. Record which format was actually generated and where it was written.

Build pass criteria: the expected installer exists, its version is correct, and its packaged contents pass inspection.

10. Database and migration release policy

JARVIS uses SQLite, SQLAlchemy 2.x, and Alembic under the planned architecture. Database migration changes require explicit release review.

10.1 Migration rules

- Every schema change must have a reviewed Alembic migration.
- Migration revisions must form a valid chain.
- Test both fresh database creation and upgrades from supported previous versions.
- Never assume an existing installation has the latest schema.
- Do not silently delete or recreate an existing database to recover from a migration failure.
- Do not edit a migration that has already shipped; create a corrective migration instead.
- Record the expected database revision for the release.
- Prefer backward-compatible, staged schema changes when rollback may be required.

10.2 Migration execution

Run migrations using the project's actual migration entry point and configuration.

Before a production upgrade:

1. Ensure JARVIS and its backend are stopped.
2. Identify the active database path.
3. Validate the database file is accessible.
4. Create a verified backup.
5. Record the current Alembic revision.
6. Apply the migration using the supported application migration workflow.
7. Verify the resulting schema revision.
8. Run database integrity and application smoke tests.

Do not assume a generic Alembic command will use the same configuration as the packaged application.

10.3 Migration failure

If migration fails:

- Capture the error and logs.
- Stop automatic retries if repeated attempts may make the situation worse.
- Preserve the original database and backup.
- Do not manually delete Alembic version records to force an upgrade.
- Determine whether the failure happened before or after a partial change.
- Follow the documented recovery or rollback procedure.
- Verify integrity and expected application behavior before reopening the database.

A database schema downgrade is not automatically safe. Prefer restoring a verified backup when a release has performed an incompatible data transformation.

11. Code signing and artifact integrity

11.1 Signing policy

For public Windows distribution, sign the installer and relevant executable artifacts using an approved code-signing certificate where available.

- Protect the private key.
- Do not place signing passwords in source code or committed scripts.
- Use the approved signing provider or secure CI signing mechanism.
- Apply an appropriate trusted timestamp during signing.
- Sign the final artifact that will actually be distributed.
- Verify signatures after signing and after any packaging or copying step that could alter the file.

A signature does not guarantee that Windows SmartScreen will show no warning. Reputation, certificate type, distribution history, and Windows policy can affect warnings.

If signing is not available, record the release as unsigned and communicate the implications. Do not describe an unsigned build as signed.

11.2 Signature verification

On Windows, verify the signature with PowerShell:

Get-AuthenticodeSignature .\JARVIS-Setup.exe |
    Format-List Status, StatusMessage, SignerCertificate

Replace the example filename with the actual artifact.

For signed releases, the expected status must be valid, the certificate identity must match the approved signer, and the timestamp must be checked according to release policy.

If verification fails, do not publish the artifact until the failure is understood and resolved.

11.3 Checksums

Generate a SHA-256 checksum for each distributable artifact:

Get-FileHash .\JARVIS-Setup.exe -Algorithm SHA256

Record the exact hash in the release manifest and publish it through the approved distribution channel.

Users and release operators must be able to recompute the hash and compare it to the trusted release manifest.

A checksum detects file differences; it does not establish who produced the file unless the checksum itself is distributed through a trusted channel.

12. Clean-machine testing

A clean-machine test is mandatory for a production release.

Use a disposable Windows VM or a physical machine that does not have the development environment installed. Record the Windows version, architecture, and relevant system configuration.

12.1 Clean-machine prerequisites

The test machine must not rely on:

- The developer's Python installation.
- A globally installed Node.js or Rust toolchain.
- The source repository.
- A developer ".env" file.
- A running Vite development server.
- A developer's local database.
- A globally installed copy of JARVIS.
- Cached build output that is missing from the installer.

Use a snapshot or disposable VM so the environment can be reset between installation scenarios.

12.2 Fresh installation test

1. Verify the downloaded installer's checksum.
2. Verify its signature, if applicable.
3. Launch the installer using the documented install mode.
4. Confirm expected UAC behavior and publisher identity.
5. Install into the intended location.
6. Confirm expected files and shortcuts are created.
7. Launch JARVIS from the installed shortcut.
8. Confirm the UI loads without a development server.
9. Confirm the backend becomes healthy.
10. Confirm a new user database is created in the expected location.
11. Complete any first-run onboarding.
12. Test core functionality.
13. Close and relaunch the application.
14. Inspect logs for startup errors.

12.3 Core functional smoke tests

Run all features that are marked release-critical in the PRD.

Area| Test| Pass condition
Startup| Launch installed application| UI loads and backend becomes ready
Backend| Health check| Expected successful response
Database| Create and read test data| Data persists after restart
Migrations| Fresh database setup| Latest required revision reached
AI provider| Configure valid test credentials| Expected request succeeds
AI failure| Use invalid test credentials| Clear error, no crash or secret leak
Network| Disconnect network| Offline behavior is controlled and understandable
Voice| Test available microphone| Permission and capture work as designed
Audio| Test playback| Audio output works on the selected device
Logging| Trigger a controlled failure| Diagnostic details are recorded
Shutdown| Exit JARVIS| Backend process exits as expected
Relaunch| Start it again| No orphan process or stale-port failure

Some tests require network access or specific hardware. Mark these tests as not applicable only when the feature is genuinely unavailable in the tested environment, and record the limitation.

12.4 Additional environment coverage

Test as appropriate for the product's support policy:

- Windows 10 and Windows 11 versions that are officially supported.
- Standard user account without administrator privileges.
- Non-default installation paths.
- Paths containing spaces.
- A user profile path containing non-ASCII characters.
- A machine with no Python installed.
- A machine with a conflicting local port, if a fixed port is used.
- A machine without an available microphone.
- A machine with multiple audio input/output devices.
- A restricted network or proxy environment if supported.

Do not claim compatibility with an environment that has not been tested or is outside the support policy.

13. Upgrade testing

Test upgrading from every supported previous release or a representative set defined by the release policy.

13.1 Standard upgrade

1. Install the previous signed release.
2. Launch it and create representative test data.
3. Record the application version and database revision.
4. Close JARVIS cleanly.
5. Back up the database and required user configuration.
6. Install the new release using the documented upgrade path.
7. Confirm the installation location and application identity remain correct.
8. Launch the upgraded application.
9. Confirm the database migration completes.
10. Confirm old conversations, settings, tasks, and other supported data remain available.
11. Verify core functionality.
12. Restart the application and repeat the key persistence checks.
13. Inspect logs for migration warnings and errors.

13.2 Interrupted upgrade

Where feasible, test controlled failure scenarios in a disposable environment:

- Installer is cancelled.
- Application is running during installation.
- Disk space is insufficient.
- Database is locked.
- Migration fails.
- A required file is missing or inaccessible.

The application must not report success if the upgrade failed. It must preserve user data and provide a recoverable state.

Never intentionally corrupt a real user's installation for testing.

13.3 Data compatibility

A newer release may update a database schema in ways an older release cannot understand.

Before shipping such a migration, document whether rollback requires:

- Reinstalling the previous application without restoring the database.
- Restoring a pre-upgrade database backup.
- Running a specifically tested recovery procedure.

Do not promise automatic downgrade compatibility unless it has been demonstrated.

14. Installer and uninstall testing

14.1 Installer verification

Verify that:

- The installer displays the expected product name and version.
- Publisher information is correct when signed.
- Install paths are correct.
- Shortcuts and application registration are correct.
- The backend is included.
- Required runtime resources are present.
- No development files or secrets are packaged.
- Installation errors are reported clearly.

14.2 Uninstall behavior

Uninstall behavior must be explicitly defined and tested.

The installer should distinguish between:

Application files

- Main application binaries.
- Bundled backend and runtime files.
- Application-owned installed resources.
- Shortcuts and registration entries created by the installer.

User data

- SQLite database.
- User settings and preferences.
- User-created content.
- Logs and diagnostic data.
- User-managed provider credentials, if stored locally.

Unless the product's approved data-retention policy explicitly says otherwise, uninstall should not silently destroy user data.

If the user-data directory is retained, document its location and the process for removing it manually. If the installer offers a delete-data option, make the consequences explicit and test the option separately.

After uninstall:

1. Confirm the app is no longer registered as installed.
2. Confirm shortcuts and installer-owned files are removed.
3. Confirm no backend process remains running.
4. Confirm the expected user-data retention behavior.
5. Confirm a fresh reinstall works.
6. Confirm a reinstall can recover retained data when that behavior is supported.

15. Rollback and recovery

Rollback has two separate dimensions: application rollback and data rollback.

15.1 Application rollback

If a release fails after publication:

1. Stop distributing the faulty artifact.
2. Mark the release as withdrawn or affected.
3. Preserve its manifest, logs, hashes, and test evidence.
4. Identify the last known-good release.
5. Verify the last known-good installer and checksum.
6. Test the rollback installer in a disposable environment.
7. Confirm the older application can operate with the available database state.
8. Publish rollback instructions or a fixed release.
9. Notify affected users through the approved channel.
10. Record the incident and corrective action.

15.2 Database rollback

Before every migration, create a backup using the approved database backup process.

A rollback that requires database restoration must include:

1. Stop JARVIS and its backend.
2. Preserve a copy of the failed-state database for investigation.
3. Locate the verified pre-upgrade backup.
4. Validate the backup's identity and integrity.
5. Restore to the documented database path using the approved restore procedure.
6. Confirm the restored revision and database integrity.
7. Start the compatible application version.
8. Run smoke tests and verify representative user data.

Restoring a backup can discard changes made after the backup was created. Document this data-loss window clearly.

Do not overwrite the only copy of a database during recovery.

15.3 Rollback limitations

An older application may be incompatible with a newer database schema or with data transformed by a migration.

If backward compatibility cannot be guaranteed, the release must use a tested backup-restore procedure or another verified recovery strategy. Do not rely on an untested automatic downgrade.

15.4 Emergency release

For a critical issue, prepare a patch release from a reviewed source revision. Re-run all mandatory checks affected by the change, along with installation, startup, migration, and upgrade tests.

An emergency release does not waive artifact integrity, data safety, or evidence requirements.

16. Logs and release diagnostics

A release must provide enough diagnostic information to investigate startup, backend, database, AI provider, and voice failures without collecting unnecessary private data.

Record the actual locations and formats for:

- Tauri/Rust host logs.
- Python backend logs.
- Frontend runtime errors.
- Database migration results.
- Installer logs, where available.
- AI provider request failures and response status codes.
- Voice-device initialization errors.
- Application version and backend version.

16.1 Diagnostic rules

- Redact API keys, authorization headers, access tokens, and secrets.
- Do not log complete provider credentials or raw authentication responses.
- Avoid collecting full conversations or voice recordings by default.
- Keep logs in the documented user-writable data directory.
- Rotate logs and enforce reasonable size limits.
- Include timestamps, component names, error categories, and correlation IDs where useful.
- Do not expose sensitive exception details to ordinary users.
- Make a diagnostic export optional and review its contents before sharing.

16.2 Release diagnostic bundle

For an approved diagnostic bundle, include only necessary information:

- Application and backend versions.
- Windows version and architecture.
- Sanitized startup logs.
- Sanitized migration status.
- Dependency and runtime diagnostics needed for the issue.
- Installer version and artifact hash.
- Relevant error codes and timestamps.

Exclude secrets, private conversations, personal files, and database contents unless explicitly necessary, consented to, and securely handled.

17. AI provider and voice release checks

These features may depend on user configuration, network availability, external services, and hardware.

17.1 AI providers

Test:

- No provider configured.
- Valid credentials.
- Invalid credentials.
- Rate-limit responses.
- Provider timeout.
- Network disconnection.
- Unsupported model or invalid request.
- Fallback to another configured provider, if supported.
- Missing or malformed response handling.

Verify that the app explains recoverable failures, avoids logging secrets, and does not crash because a provider is unavailable.

Do not package personal API keys into the release artifact. Any optional provider integration must follow the approved authentication and secret-storage design.

17.2 Voice devices

Test with the supported voice configuration:

- Microphone permission denied.
- No microphone available.
- Default input device changed.
- Default output device changed.
- Device disconnected while active.
- Unsupported or unavailable speech service.
- Playback failure.
- Application restart after a voice error.

Confirm the application reports which operation failed and offers a recovery path where feasible.

If speech recognition or synthesis requires a network service, clearly distinguish network/service failures from hardware or permission failures.

18. Release CI pipeline

Automate as much of the release process as practical.

Recommended pipeline:

Reviewed Source Revision
          |
          v
Dependency & Secret Checks
          |
          v
Frontend Tests + Type Checks
          |
          v
Python Tests + Migration Tests
          |
          v
Production Frontend Build
          |
          v
Backend Packaging
          |
          v
Tauri Installer Build
          |
          v
Artifact Inspection
          |
          v
Signing + Signature Verification
          |
          v
SHA-256 Manifest
          |
          v
Clean-Machine Installation Tests
          |
          v
Upgrade / Data Safety Tests
          |
          v
Human Release Approval
          |
          v
Publish Release Artifacts

The pipeline should fail when mandatory checks fail. Do not use a successful earlier stage as proof that later packaging, signing, or installation stages succeeded.

Build and publish from an approved release commit or tag. Store test outputs and release evidence alongside the release record.

19. Release artifact layout

The exact layout depends on the distribution platform. A recommended release directory is:

release/
├── JARVIS-Setup-<version>.exe
├── SHA256SUMS.txt
├── RELEASE-NOTES.md
├── RELEASE-MANIFEST.json
├── SIGNATURE-VERIFICATION.txt
├── TEST-REPORT.md
└── EVIDENCE/
    ├── build-log.txt
    ├── dependency-report.txt
    ├── migration-test-report.txt
    ├── clean-install-report.txt
    ├── upgrade-test-report.txt
    └── uninstall-test-report.txt

Only include files that actually exist and were generated or verified. If the installer is MSI or the build produces multiple supported artifacts, record the real names and formats.

Do not publish private signing material, local ".env" files, full databases, private logs, or unredacted diagnostic bundles.

20. Release manifest

Create a machine-readable manifest for every release. Example structure:

{
  "product": "JARVIS",
  "version": "1.0.0",
  "source_commit": "<full-git-commit-sha>",
  "source_tag": "v1.0.0",
  "target": "windows-x64",
  "installer_format": "<actual-format>",
  "backend_version": "1.0.0",
  "database_revision": "<actual-alembic-revision>",
  "build_environment": {
    "windows": "<actual-version>",
    "node": "<actual-version>",
    "rust": "<actual-version>",
    "python": "<actual-version>"
  },
  "signed": false,
  "artifacts": [
    {
      "filename": "<actual-artifact-filename>",
      "sha256": "<actual-sha256>"
    }
  ]
}

This is a template, not evidence of a completed release. Replace every placeholder with measured values. The "signed" value must reflect actual signature verification, not the intention to sign.

21. Verified evidence rules

Release claims must be supported by actual evidence.

21.1 Acceptable evidence

Depending on the claim, acceptable evidence includes:

- Build logs showing the exact source revision and successful build exit status.
- Recorded toolchain and dependency versions.
- Automated test reports from the release commit.
- Installer file metadata and SHA-256 hashes.
- Valid Authenticode verification output.
- Clean-machine test logs.
- Recorded installation and application startup results.
- Successful health-check responses from the packaged backend.
- Database migration and integrity-test results.
- Upgrade and uninstall test results.
- Screenshots or screen recordings tied to a documented test run.
- Release approval records.

21.2 Evidence quality

Every evidence item should identify:

- The claim being verified.
- The exact artifact or source revision.
- The environment used.
- The test steps.
- The observed result.
- The date/time of the test.
- The test operator or CI run identifier.
- Any known limitations.

Evidence must be reproducible where practical and retained according to the project's release policy.

21.3 Prohibited claims

Do not claim that:

- The installer is signed without verified signature output.
- The application works on a clean machine without a clean-machine test.
- The backend is fully bundled without testing it without the development environment.
- A migration is safe without testing supported upgrade paths.
- User data survives upgrades without persistence checks.
- Uninstall preserves data without verifying the actual behavior.
- The release is secure, vulnerability-free, or production-ready solely because tests pass.
- A file exists, a command succeeded, or a release was published without checking the result.

If evidence is missing, mark the item Not verified. Do not turn assumptions into pass results.

22. Release checklist

The release owner must complete the following checklist before publication.

Source and build

- [ ] Release commit reviewed and approved.
- [ ] Working tree and release source revision verified.
- [ ] Dependency lockfiles validated.
- [ ] Required frontend and Python tests passed.
- [ ] Production frontend build completed.
- [ ] Backend packaged and tested independently.
- [ ] Tauri production installer built.
- [ ] Packaged resources and runtime paths inspected.
- [ ] No developer-only configuration or secrets included.

Database and data safety

- [ ] Fresh database initialization tested.
- [ ] Alembic migration chain validated.
- [ ] Upgrade from supported previous versions tested.
- [ ] Database backup and restore tested.
- [ ] User data retention behavior verified.
- [ ] Rollback limitations documented.

Installer and platform

- [ ] Correct product version and application identifier verified.
- [ ] Correct installer format and architecture verified.
- [ ] Signature validated, or unsigned status clearly recorded.
- [ ] SHA-256 checksums generated.
- [ ] Clean-machine installation passed.
- [ ] Standard-user execution tested where supported.
- [ ] Application startup and backend health check passed.
- [ ] Upgrade and uninstall tests passed.
- [ ] Reinstall behavior verified.

Product functionality

- [ ] Core PRD acceptance tests passed.
- [ ] AI provider success and failure paths tested.
- [ ] Voice behavior tested on supported hardware.
- [ ] Logging and diagnostics verified.
- [ ] Application shutdown leaves no unintended backend process.
- [ ] No release-blocking defects remain.

Publication

- [ ] Release notes prepared.
- [ ] Manifest completed with actual values.
- [ ] Test reports and evidence attached.
- [ ] Artifact hashes independently verified.
- [ ] Release owner approval recorded.
- [ ] Published artifact matches the tested artifact.
- [ ] Rollback instructions and last known-good release identified.

A failed mandatory check blocks release until resolved or formally handled through an explicitly approved exception process.

23. Release notes template

# JARVIS <VERSION>

Release date: <YYYY-MM-DD>
Supported platform: <actual Windows versions and architecture>

## Highlights
- <User-visible change>

## Fixes
- <Verified fix>

## Known issues
- <Known limitation>

## Compatibility
- Previous versions supported for upgrade: <versions>
- Database migration: <revision or none>
- Rollback requirements: <verified instructions>

## Installation
- Installer: <actual filename>
- SHA-256: <actual hash>
- Signature: <verified status>

## Verification
- Build: <CI run or build record>
- Tests: <test report>
- Clean-machine test: <result>

Include only changes and results that have been verified for the published artifact.

24. Release incident record

When a release causes a serious problem, record:

# Release Incident

Affected version:
First observed:
Reported behavior:
Affected Windows versions:
Reproduction steps:
Expected result:
Actual result:
Severity:
User-data risk:
Relevant sanitized logs:
Relevant artifact hash:
Last known-good version:
Immediate mitigation:
Rollback or recovery procedure:
Root cause:
Corrective action:
Regression test added:
Resolution version:
Verification evidence:

Protect user privacy when collecting reports. Never ask users to send API keys, passwords, private signing keys, or unredacted database files through ordinary support channels.

25. Definition of Done

A JARVIS Windows release is complete only when:

1. The tested source revision is identifiable.
2. The production frontend and Python backend are correctly packaged.
3. The Tauri installer installs and launches on a clean supported Windows machine.
4. The backend reaches readiness and exits correctly.
5. Database creation, migrations, backup, restore, and supported upgrades have been tested.
6. Core PRD functionality passes its release acceptance tests.
7. Installer signing status and artifact checksums are verified and recorded.
8. Upgrade, uninstall, and rollback behavior is documented and tested.
9. Release notes, manifest, and verification evidence are complete.
10. The exact tested artifact is the one approved for publication.

Final rule: No unverified release claims. If a test has not been run, record it as Not verified, not Passed.

---

Repository alignment note: Before treating this document as executable release instructions, reconcile all example commands, executable names, paths, installer targets, health endpoints, version sources, migration commands, and log locations with the actual JARVIS repository and its approved PRD. The repository's implemented architecture and supported Windows targets are authoritative.