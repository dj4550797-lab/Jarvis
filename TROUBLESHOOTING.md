JARVIS — TROUBLESHOOTING.md

Windows-Focused Diagnostics, Recovery, and Verification Guide

Property| Specification
Project| JARVIS Desktop AI Assistant
Primary OS| Windows 10/11, subject to the project's supported OS policy
Desktop Framework| Tauri 2
Frontend| React + TypeScript + Vite
Backend| Python + FastAPI
Database| SQLite + SQLAlchemy 2.x
Migrations| Alembic
Native Toolchain| Rust + Cargo + Tauri CLI
Purpose| Diagnose, repair, and verify application failures

---

1. Purpose and troubleshooting rules

This document defines the standard procedure for diagnosing JARVIS startup failures, backend errors, Tauri build problems, missing dependencies, database issues, AI provider failures, voice-device errors, logging problems, and installer failures.

All fixes must preserve the approved JARVIS PRD and existing architecture.

1.1 Mandatory diagnostic workflow

Follow this sequence for every issue:

1. Reproduce the problem and record the exact error.
2. Identify the failing subsystem.
3. Collect relevant logs and environment information.
4. Run the least destructive diagnostic command.
5. Apply one targeted fix.
6. Restart only the affected subsystem.
7. Repeat the original failing operation.
8. Run the relevant regression tests.
9. Document the root cause and verified resolution.

Do not randomly reinstall dependencies, delete the database, change framework versions, or disable security controls to make an error disappear.

1.2 PowerShell conventions

Unless specified otherwise, commands in this guide are for PowerShell.

Run them from the appropriate project directory.

Example:

Set-Location "C:\path\to\JARVIS"
Get-Location
Get-ChildItem

Replace example paths with the actual repository path.

Use the project's existing folder structure. If the Python backend lives in a subdirectory, run Python and Alembic commands from that directory.

1.3 Important safety rules

- Never share API keys, access tokens, passwords, or complete ".env" files in logs or screenshots.
- Never delete "jarvis.db" as a first-line fix.
- Never delete Alembic migration files to fix a migration error.
- Never run an unknown installer or script as Administrator merely because it failed.
- Never disable antivirus, Windows Defender, TLS validation, or firewall protection as a routine fix.
- Never expose the FastAPI backend to the public internet merely to resolve a local connection problem.
- Back up user data before schema repair, restore, or risky dependency changes.

---

2. First-response diagnostics

Before changing anything, collect the basic environment information.

2.1 Check Windows and available tools

$PSVersionTable
Get-ComputerInfo |
    Select-Object WindowsProductName, WindowsVersion, OsArchitecture

Get-Command python, py, pip, node, npm, cargo, rustc `
    -ErrorAction SilentlyContinue |
    Select-Object Name, Source

Check the installed versions:

python --version
py --version
node --version
npm --version
rustc --version
cargo --version

Some commands may be unavailable when the corresponding tool is not installed or not on "PATH". That is a diagnostic result, not a reason to install everything immediately.

2.2 Verify the project structure

Get-ChildItem -Force
git status --short
git branch --show-current

Confirm that the expected files exist, such as:

- "package.json"
- "src-tauri\tauri.conf.json"
- "Cargo.toml"
- "pyproject.toml" or "requirements.txt"
- "alembic.ini", if Alembic is configured in that directory.

These are expected examples. Use the paths actually defined by the repository.

2.3 Record the exact symptom

Capture:

- The command or user action that failed.
- The complete error message, with secrets removed.
- Whether the failure happens on startup, during use, or during shutdown.
- Whether the same operation previously worked.
- Whether the failure started after a code change, dependency update, migration, or installation.

Verification: Another developer should be able to reproduce the same failure from the recorded steps.

---

3. Startup failures

3.1 JARVIS does not open

Symptoms

- Nothing happens after launching the application.
- The window appears and immediately closes.
- A process starts but no usable window appears.

Diagnosis

Get-Process |
    Where-Object {
        $_.ProcessName -match "jarvis|python|node"
    } |
    Select-Object ProcessName, Id, StartTime

Check whether the installed application is already running or whether a stale development process is occupying a port.

Inspect the terminal output from the same launch command that normally starts JARVIS.

Fix

1. Close the application normally.
2. Stop only the confirmed stale process if necessary.
3. Launch the application using the project's documented development command.
4. Inspect the first fatal error rather than the last cascading error.
5. Verify that the backend starts before the UI attempts to use it, if the existing architecture requires that sequence.

Do not terminate every Python or Node process on the system.

Verification

- The application opens consistently.
- No immediate process exit occurs.
- The expected backend health check succeeds.
- The main UI loads without an uncaught initialization error.

3.2 Blank or white window

Symptoms

- The desktop window opens but remains blank.
- React components do not render.
- The UI shows a loading indicator indefinitely.

Diagnosis

Start the frontend independently:

npm run dev

Use the actual frontend package directory and its existing scripts.

Check the terminal for Vite compilation errors. Open the application's developer tools if enabled in the development build.

Inspect:

- Failed JavaScript imports.
- React rendering exceptions.
- Incorrect API base URLs.
- Failed backend requests.
- Asset paths and route configuration.

Fix

- Correct TypeScript or Vite build errors.
- Repair the failing import or component.
- Verify the frontend/backend URL configuration.
- Check Tauri-specific asset and resource paths.
- Keep development-only debugging features out of production builds.

Verification

npm run build

The production frontend build must succeed, and the desktop application must render the affected screen in both development and production modes where supported.

3.3 Application hangs during startup

Symptoms

- A loading screen never completes.
- The window becomes unresponsive.
- Startup appears stuck while initializing the database, voice devices, or an AI provider.

Diagnosis

Inspect the last successful startup log entry.

Determine whether the application is blocked by:

- Database initialization.
- A migration.
- A network request.
- AI provider discovery.
- Audio-device enumeration.
- A deadlock or blocking operation.

Fix

- Keep slow network and provider checks out of critical UI initialization.
- Apply appropriate request timeouts.
- Avoid blocking the UI thread.
- Avoid long-running synchronous work on the FastAPI event loop.
- Report optional subsystem failures separately from core startup failures.
- Do not skip required security or data-integrity checks merely to speed up startup.

Verification

Start JARVIS without an AI provider connection. Core UI and local database functionality should still behave according to the PRD's offline and degraded-mode requirements.

---

4. Python backend and FastAPI

4.1 Python is not found

Example error

'python' is not recognized as an internal or external command

Diagnosis

Get-Command python -ErrorAction SilentlyContinue
Get-Command py -ErrorAction SilentlyContinue
py --list

Fix

Install a supported Python version using the project's pinned version policy.

Ensure the intended Python installation is available to the current shell. Avoid mixing system Python, Microsoft Store aliases, and multiple virtual environments unintentionally.

Use the Python launcher when appropriate:

py -3.12 --version

Use this example only if Python 3.12 is the version supported by the repository.

Verification

python --version
python -c "import sys; print(sys.executable)"

The reported interpreter path must match the intended environment.

4.2 Virtual environment is missing or incorrect

Diagnosis

Test-Path .\.venv\Scripts\python.exe
.\.venv\Scripts\python.exe --version

If the backend is in another directory, adjust the path.

Fix

Create an environment using the project's required Python version:

py -3.12 -m venv .venv

Activate it:

.\.venv\Scripts\Activate.ps1

If PowerShell blocks activation, use the environment's Python executable directly instead of weakening the machine-wide execution policy.

Install dependencies using the repository's existing dependency-management approach:

python -m pip install --upgrade pip
python -m pip install -r requirements.txt

If the project uses "pyproject.toml" and a lockfile, follow its established installation command instead.

Verification

python -c "import sys; print(sys.prefix); print(sys.executable)"
python -m pip check

The interpreter must be from the intended environment, and "pip check" must report no dependency conflicts.

4.3 FastAPI does not start

Symptoms

- Import errors.
- Uvicorn cannot import the application.
- Startup crashes while initializing models or configuration.

Diagnosis

Run the project's configured ASGI entry point. For an application exposed as "app.main:app", the development command may be:

python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

This module path and port are examples; use the actual entry point and port defined by JARVIS.

Check:

python -c "import fastapi, sqlalchemy; print(fastapi.__version__, sqlalchemy.__version__)"

Fix

- Correct the import path.
- Install missing packages in the active environment.
- Fix circular imports.
- Ensure configuration is loaded before dependent services initialize.
- Do not create a second database engine unintentionally.
- Keep reload mode for development only.

Verification

Invoke-WebRequest "http://127.0.0.1:8000/openapi.json"

Use this command only if the documented endpoint is enabled. A successful response must match the application's expected API schema.

Then test the actual health endpoint, if the project defines one.

4.4 Port already in use

Example error

Address already in use

Diagnosis

Get-NetTCPConnection -LocalPort 8000 -State Listen `
    -ErrorAction SilentlyContinue

Inspect the owner PID:

Get-Process -Id <PID>

Replace "<PID>" with the actual numeric process ID.

Fix

- Stop the confirmed stale JARVIS development process, or
- Use the port configured by the existing application architecture.

Do not kill an unknown process.

Do not change the frontend API URL without changing and verifying the backend configuration consistently.

Verification

Restart the backend and confirm that the intended process owns the configured port and responds to the health check.

4.5 Python import errors

Example

ModuleNotFoundError: No module named 'sqlalchemy'

Diagnosis

python -c "import sys; print(sys.executable)"
python -m pip show sqlalchemy
python -m pip check

Fix

Install the missing dependency using the project's dependency manifest and active environment.

Do not install arbitrary package versions one by one if a lockfile already defines compatible versions.

Verification

python -c "import sqlalchemy, fastapi, pydantic; print('Imports OK')"

Add the affected module's import test to the backend test suite when appropriate.

---

5. Tauri 2 and Rust

5.1 Rust or Cargo is missing

Diagnosis

rustc --version
cargo --version
rustup show

Fix

Install Rust using the official Rust installation procedure and ensure the toolchain selected by the repository is installed.

Restart PowerShell after environment changes.

If the repository pins a Rust toolchain, use that version instead of blindly installing the newest toolchain.

Verification

rustc --version
cargo --version
cargo check --manifest-path src-tauri\Cargo.toml

Run the last command from the repository root only when "src-tauri\Cargo.toml" exists.

5.2 Windows native build tools are missing

Example symptoms

- "link.exe" not found.
- MSVC linker failures.
- Native dependency compilation fails.

Diagnosis

where.exe link
where.exe cl
rustup show

Fix

Install the Windows C++ build tools and Windows SDK components required by the project's Tauri 2 toolchain.

Use the official Visual Studio Installer configuration appropriate for the supported Rust target.

Open a new terminal after installation, or use the appropriate developer shell.

Verification

rustup target list --installed
cargo check --manifest-path src-tauri\Cargo.toml

The expected Windows target must be installed, and Cargo must complete successfully.

5.3 WebView2 runtime errors

Symptoms

- The production window fails to render.
- WebView2 initialization fails.
- The installer works on the development PC but fails on another Windows machine.

Diagnosis

Check the Windows installation for Microsoft Edge WebView2 Runtime using Windows' installed-app information and the official WebView2 installation diagnostics.

Do not assume that having the Edge browser installed proves that the required WebView2 runtime is available.

Fix

Install or repair the supported WebView2 Runtime using Microsoft's official installer and the project's deployment policy.

For offline installations, package or provision the runtime only through a supported distribution approach.

Verification

Run the packaged JARVIS application on a clean Windows test machine and confirm that the WebView initializes and the UI renders.

5.4 Tauri configuration or command errors

Symptoms

- Invalid "tauri.conf.json".
- Unknown Tauri CLI command.
- Rust compilation fails after a configuration change.

Diagnosis

npm ls @tauri-apps/cli @tauri-apps/api
cargo tree --manifest-path src-tauri\Cargo.toml

Check the installed Tauri CLI version against the project's dependencies.

Fix

- Correct invalid configuration values.
- Keep Rust crate versions and JavaScript Tauri packages compatible.
- Use the project's existing scripts.
- Do not mix Tauri 1 instructions or dependencies into a Tauri 2 application.

Verification

Run the existing Tauri development command, then build the production application.

Both the native compilation and the resulting application launch must succeed.

---

6. Missing frontend dependencies

6.1 "npm install" or build failures

Diagnosis

node --version
npm --version
npm ls

Inspect:

- "package.json"
- The project's lockfile.
- The required Node.js version.
- The first dependency-resolution error.

Fix

For a repository using "package-lock.json", prefer a reproducible install:

npm ci

Use "npm install" only when the dependency manifest or lockfile needs an intentional update.

Do not delete the lockfile merely to bypass a dependency conflict.

Verification

npm ls
npx tsc --noEmit
npm run build

These commands assume the corresponding scripts and TypeScript configuration exist.

All must complete without unresolved dependency or compilation errors.

6.2 Vite starts but the UI cannot connect to FastAPI

Diagnosis

Test-NetConnection 127.0.0.1 -Port 8000

Inspect the actual API URL configured by JARVIS.

Fix

- Start the backend using its configured port.
- Correct the environment-specific API URL.
- Verify the Tauri development and production URL settings.
- Check that production builds do not accidentally point to the Vite development server.
- Keep local API access restricted according to the security design.

Verification

Perform a real frontend request against the backend's documented health endpoint and confirm the expected response.

---

7. Database and Alembic failures

7.1 Database file not found

Symptoms

- SQLite creates a new empty database.
- Existing conversations or settings appear missing.
- The application reports missing tables.

Diagnosis

Print the resolved database path through a sanitized diagnostic:

Get-ChildItem Env: |
    Where-Object {
        $_.Name -match "DATABASE|JARVIS.*DATA"
    } |
    Select-Object Name

Do not print database credentials or the entire environment.

Check the actual application-data directory and verify that the database file exists.

Fix

- Correct the configured application-data path.
- Use an absolute path in production.
- Verify that the application has read/write access.
- Preserve the original database before attempting recovery.
- Never initialize an empty production database simply because the expected path is missing.

Verification

Restart JARVIS and confirm that expected records are available from the original database.

7.2 "no such table" or schema mismatch

Diagnosis

From the backend environment:

alembic current
alembic history

Use the configured Alembic directory and database URL.

Verify that the application and Alembic target the same database file.

Fix

If the database is simply behind the current schema:

1. Back it up.
2. Confirm the migration history.
3. Apply the reviewed migration.

alembic upgrade head

If the revision history is inconsistent, stop and investigate. Do not use "stamp head" as a shortcut to hide missing tables or unapplied migrations.

Verification

- The Alembic revision matches the intended release.
- Required tables and columns exist.
- The application's database health check succeeds.
- Existing data remains intact.

7.3 Alembic migration fails

Symptoms

- A migration crashes midway.
- A column already exists.
- SQLite rejects a table alteration.
- Existing data violates a new constraint.

Diagnosis

Inspect:

- The exact migration revision.
- The current database revision.
- The migration traceback.
- The actual table schema.
- Whether the migration is safe to rerun.

Fix

1. Stop application writes if schema integrity is uncertain.
2. Preserve the database.
3. Reproduce the issue on a copy.
4. Correct the migration in a new, appropriate revision when necessary.
5. Use SQLite-compatible batch operations for supported schema changes.
6. Backfill data before enforcing new constraints.
7. Never edit an already-released migration to disguise a production failure.

Verification

Test the migration from the previous supported revision on a disposable copy containing representative data.

Run:

PRAGMA integrity_check;
PRAGMA foreign_key_check;

Confirm the target revision and run database integration tests.

7.4 Database locked

Example

sqlite3.OperationalError: database is locked

Diagnosis

Identify long-running transactions, simultaneous migration attempts, multiple processes, and background tasks that are holding write locks.

Fix

- Keep transactions short.
- Never wait for an AI provider while holding a write transaction.
- Ensure only one controlled migration process runs at a time.
- Configure a tested busy timeout.
- Use bounded retries only for safe, retryable operations.
- Consider WAL after validating its operational and backup behavior.

Verification

Run a controlled concurrent-read/write test. Confirm that normal writes complete without indefinite hangs, unhandled lock errors, or duplicate task execution.

7.5 Database corruption

Diagnosis

Use a backup or controlled maintenance copy to run:

PRAGMA integrity_check;
PRAGMA foreign_key_check;

SQLite CLI, if installed, can inspect a copy:

sqlite3 "C:\path\to\jarvis.db" "PRAGMA integrity_check;"

Fix

- Stop writes to the affected database.
- Preserve the original file and related WAL files.
- Validate available backups.
- Restore a known-good backup through the documented procedure.
- If no valid backup exists, perform recovery work on a copy and document potential data loss.

Do not overwrite the only copy of a corrupted database with an unverified repair.

Verification

Integrity checks pass, expected records are available, migrations are consistent, and the application can read and write a test record safely.

---

8. AI provider and model failures

8.1 API key missing or invalid

Symptoms

- HTTP 401 or 403.
- Authentication failures.
- The provider reports missing credentials.

Diagnosis

Check whether the expected environment variable or approved credential entry is configured without printing its value.

Test-Path Env:OPENAI_API_KEY

This variable is an example only. Use the actual provider's configured credential name.

Fix

- Configure the correct credential using the existing secret-management mechanism.
- Verify that the selected provider and model match the credential.
- Check account permissions and provider-side access.
- Restart the backend if configuration is loaded only at startup.

Never place the API key in source code, frontend variables exposed to the browser, or diagnostic logs.

Verification

Make a minimal test request to the configured provider and confirm a successful authenticated response without exposing the key.

8.2 Rate limit or quota exceeded

Symptoms

- HTTP 429.
- Requests fail after a period of successful use.
- The provider reports quota or usage limits.

Diagnosis

Inspect the provider's error category and documented response headers.

Distinguish rate limiting from exhausted account quota.

Fix

- Apply bounded exponential backoff with jitter where permitted.
- Respect provider retry guidance.
- Limit concurrent requests.
- Avoid retrying permanent authentication or request-validation errors.
- Use the existing fallback mechanism only when the alternative provider is configured, authorized, and compatible with the task.

Verification

Simulate a rate-limit response in tests and verify that retries are bounded, the UI reports the correct state, and the application does not enter an endless retry loop.

8.3 Model not found or unsupported request

Symptoms

- HTTP 400 or 404.
- Invalid model name.
- Unsupported message format or capability.

Diagnosis

Check the selected model ID, provider configuration, endpoint, and request payload.

Do not assume that two providers accept identical request formats.

Fix

- Use the exact model identifier supported by the selected provider.
- Validate provider-specific parameters.
- Confirm that the selected model supports the required capability.
- Route requests through the existing provider adapter rather than bypassing it.

Verification

Run provider-adapter tests for valid requests, unsupported models, and malformed responses.

8.4 Network timeout or TLS failure

Diagnosis

Check general connectivity and DNS:

Test-NetConnection example.com -Port 443
Resolve-DnsName example.com

Replace "example.com" with the actual provider hostname.

These tests do not by themselves prove that the provider API is healthy.

Fix

- Verify the provider's service status.
- Check system clock, DNS, proxy, and network restrictions.
- Configure sensible connection and response timeouts.
- Preserve normal TLS certificate verification.
- Do not hardcode unverified certificates or disable TLS checks.

Verification

Perform a small request using the official provider SDK or the application's adapter and verify a valid response.

8.5 Fallback provider fails

Diagnosis

Determine whether the failure originates from the primary provider, fallback selection, credentials, model compatibility, or shared network infrastructure.

Fix

- Keep provider-specific errors distinguishable.
- Do not retry the same permanent error indefinitely.
- Do not send secrets between providers.
- Validate that the fallback supports the requested task.
- Respect the existing user configuration and provider permissions.

Verification

Mock primary-provider timeout, rate limiting, authentication failure, and fallback success in automated tests.

Confirm that fallback behavior follows the approved PRD.

8.6 AI response is empty or malformed

Diagnosis

Inspect sanitized response metadata and the adapter's parsing result.

Check for truncated JSON, unexpected tool-call structures, empty completion content, or a provider-specific schema change.

Fix

- Validate structured output using Pydantic.
- Reject invalid data before database persistence or tool execution.
- Apply bounded retries only where appropriate.
- Return a clear recoverable error when validation fails.
- Never execute unvalidated AI-generated commands automatically.

Verification

Feed valid, empty, malformed, and adversarial responses into adapter tests. Invalid responses must be rejected safely.

---

9. Voice and audio-device failures

Voice troubleshooting must follow the actual STT, TTS, audio-capture, and audio-playback implementations selected by the project.

9.1 Microphone not detected

Diagnosis

Open:

"Settings → System → Sound → Input"

Confirm that Windows detects the intended microphone and receives input.

Then open:

"Settings → Privacy & security → Microphone"

Check microphone access and desktop-app permissions where applicable.

Also inspect the audio-device enumeration logs from JARVIS.

Fix

- Select the correct input device.
- Connect or reconnect the device.
- Verify the Windows input volume.
- Allow microphone access through the relevant Windows settings.
- Restart the affected audio subsystem after changing devices.

Do not request broader system permissions than the feature requires.

Verification

Run the application's microphone diagnostic or a short test recording. Confirm that the intended device produces non-empty audio data and that recording can stop cleanly.

9.2 Microphone permission denied

Diagnosis

Determine whether Windows permission settings, an audio library, or the application configuration rejected access.

Fix

Enable only the required microphone permission in Windows settings and follow the documented permission flow for the application.

Do not attempt to bypass the operating system's privacy controls.

Verification

Restart JARVIS if required and perform a short recording test. Confirm that denied access produces a clear error instead of an infinite loading state.

9.3 No audio output

Diagnosis

Open:

"Settings → System → Sound → Output"

Verify the selected playback device and Windows volume.

Inspect the application's playback errors and TTS output metadata.

Fix

- Select the correct output device.
- Verify the system volume and mute state.
- Confirm that the TTS provider or local synthesis engine returned valid audio.
- Ensure the playback format matches the audio library's expected format.
- Close and reinitialize the playback stream if the device changed.

Verification

Play a known test tone or short generated audio sample and confirm audible output on the intended device.

9.4 Speech recognition returns nothing

Diagnosis

Check:

- Microphone capture success.
- Sample rate and channel count.
- Recorded audio duration.
- Silence detection and voice activity thresholds.
- STT model availability.
- Provider errors, if remote recognition is used.

Fix

Correct audio-device configuration and sample format before changing recognition thresholds.

Verify that silence handling does not discard valid speech and that remote recognition errors are distinguished from empty transcription results.

Verification

Run a known test utterance, confirm that audio is captured, and verify the expected transcription path. Use mocked audio and provider responses in automated tests where possible.

9.5 Voice stops working after sleep or device change

Diagnosis

Check whether Windows changed the default audio device or the existing audio stream became invalid.

Fix

Re-enumerate devices and recreate the audio stream using the selected library's supported lifecycle. Avoid restarting the entire application unless necessary.

Verification

Test device disconnection, reconnection, system sleep/resume, and recovery without leaving microphone handles or playback streams active.

---

10. Logs and diagnostics

10.1 Logging requirements

JARVIS should maintain structured, timestamped logs through its existing logging configuration.

Recommended fields:

- UTC timestamp.
- Severity.
- Subsystem.
- Event or error code.
- Request or operation identifier.
- Sanitized diagnostic message.
- Exception details in protected logs when appropriate.

Do not log API keys, passwords, authentication tokens, or full sensitive conversation contents.

10.2 Windows log locations

Use the actual configured application-data directory. A possible layout is:

%LOCALAPPDATA%\<Vendor>\JARVIS\
    logs\
        jarvis.log

This is an example, not a guarantee of the current implementation.

If logs are written to stdout during development, capture the terminal output from the actual launch process.

10.3 Inspect recent log entries

If JARVIS writes to the example log location:

Get-Content "$env:LOCALAPPDATA\<Vendor>\JARVIS\logs\jarvis.log" `
    -Tail 100

Replace the placeholder with the real vendor name and configured log path.

Watch the log while reproducing the issue:

Get-Content "C:\path\to\jarvis.log" -Wait

10.4 Log levels

Use:

- "DEBUG" for development diagnostics.
- "INFO" for normal lifecycle events.
- "WARNING" for recoverable failures.
- "ERROR" for failed operations.
- "CRITICAL" for failures that prevent safe operation.

Avoid enabling verbose logging permanently in production if it creates unnecessary data exposure or disk usage.

10.5 Collect a diagnostic bundle

A diagnostic bundle may include:

- Application version.
- Windows version and architecture.
- Python, Node, Rust, and Tauri versions where applicable.
- Sanitized backend and frontend logs.
- Current Alembic revision.
- Database integrity-check results.
- Enabled subsystem status.
- Recent error codes.

Exclude:

- API keys.
- Passwords and tokens.
- ".env" contents.
- Raw database files.
- Full conversation history.
- Audio recordings and private attachments.

Verification: Inspect the generated bundle before sharing it and confirm that secret patterns and sensitive content are excluded.

---

11. Installer and packaged application

11.1 Installer fails to build

Diagnosis

Run the project's production build commands.

For example:

npm run build
cargo check --manifest-path src-tauri\Cargo.toml

Then run the configured Tauri bundling command or package script.

Fix

- Resolve frontend build errors first.
- Resolve Rust compiler and linker errors.
- Confirm the Tauri bundle configuration.
- Verify icons, resources, and application identifiers.
- Ensure the expected installer target is configured.

Verification

Produce the installer using the repository's documented release command and confirm that the artifact exists at the configured output location.

11.2 Installer fails on another PC

Diagnosis

Check:

- Windows architecture.
- WebView2 Runtime availability.
- Installer prerequisites.
- File permissions.
- Required native libraries.
- Antivirus or enterprise application-control events.
- Windows Event Viewer entries for the failure.

Fix

Use supported dependencies and installation prerequisites. Test the official installer flow on a clean Windows environment.

Do not instruct users to disable Windows security tools to bypass installation failures.

Verification

Install on a clean Windows test machine using a standard user account where supported. Launch the application and verify backend startup, database initialization, UI rendering, and an AI-provider-independent basic workflow.

11.3 Application works in development but fails when packaged

Likely causes

- Incorrect asset paths.
- Missing bundled resources.
- Wrong database location.
- Missing runtime dependencies.
- Backend executable not included or not launched correctly.
- Development-only environment variables.
- Different working directory.
- Incorrect production API URL.

Fix

- Resolve paths relative to approved application directories rather than the current working directory.
- Verify the packaged backend lifecycle.
- Bundle required resources through the existing Tauri configuration.
- Keep user data outside the installation directory.
- Verify the production configuration separately from the development configuration.

Verification

Run the packaged build from a different working directory and from a standard user account. Confirm that it can initialize and use its database without relying on the source repository.

11.4 Installer upgrade fails

Diagnosis

Check whether the failure occurred during file replacement, runtime prerequisite installation, migration, or permission validation.

Fix

- Preserve the existing user-data directory.
- Ensure the installer does not overwrite the live database.
- Run database migrations through the controlled upgrade process.
- Preserve the previous application version or documented rollback route where supported.
- Never delete user data as part of a routine application upgrade.

Verification

Install version A, create representative user data, upgrade to version B, and verify that the application starts and the existing data remains accessible.

11.5 Uninstall and reinstall

Before uninstalling:

1. Back up the database and required user files.
2. Confirm that the backup is valid.
3. Record the current application version and schema revision.
4. Determine whether the uninstaller preserves user data under the existing product policy.

Do not manually delete the application-data directory to fix an ordinary installation error.

Verification

After reinstalling, restore only through the supported recovery workflow and confirm the expected records, settings, and database revision.

---

12. Regression and automated verification

Every fix must be verified at the narrowest useful level and then through relevant integration tests.

12.1 Backend tests

python -m pytest tests -q

Use the repository's actual test directory.

Verify:

- Application startup.
- Configuration loading.
- Database connection.
- Validation errors.
- Transaction rollback.
- Migration upgrades.
- Health-check behavior.
- Sanitized error responses.

12.2 Frontend tests

npm run build

If the repository defines separate test and lint scripts, run them too:

npm run test
npm run lint

Do not assume these scripts exist; check "package.json" first.

12.3 Tauri checks

cargo check --manifest-path src-tauri\Cargo.toml

Then build and launch the packaged application using the project's official release procedure.

12.4 Database verification

Using the configured backend environment:

alembic current
alembic upgrade head

Run these only against the intended development or disposable test database unless a production migration has been explicitly approved.

Also verify:

PRAGMA integrity_check;
PRAGMA foreign_key_check;

12.5 Provider tests

Use mocks or test doubles for:

- Authentication errors.
- Rate limits.
- Network timeouts.
- Invalid responses.
- Unsupported models.
- Fallback provider failures.

Tests must not depend on real API quotas or expose production credentials.

12.6 Voice tests

Test microphone capture, playback, permission denial, missing devices, device changes, and clean shutdown.

Automated tests should use mocked devices where possible; hardware-dependent tests must clearly report when a real audio device is unavailable.

12.7 Installer tests

Test installation, launch, upgrade, and uninstall behavior on supported Windows configurations.

Verify that user data is preserved according to the product's documented lifecycle.

---

13. Recovery decision guide

Failure| First action| Avoid
Application will not start| Capture first fatal error| Random reinstall
Backend import error| Verify interpreter and dependency environment| Installing packages globally
Blank window| Check frontend build and runtime console| Rebuilding everything blindly
Port conflict| Identify the owning process| Killing unknown processes
Missing database table| Check path and Alembic revision| Creating a fresh production DB
Migration failure| Back up and reproduce on a copy| Deleting migration history
Database corruption| Stop writes and validate backups| Overwriting the only database
AI provider failure| Inspect sanitized status and error category| Logging credentials
Microphone failure| Verify Windows device and permissions| Bypassing privacy controls
Installer failure| Test prerequisites and package logs| Disabling security tools
Upgrade failure| Preserve user data and inspect migration state| Deleting application-data folders

---

14. Incident report template

Use this template when an issue cannot be resolved through the documented procedures.

JARVIS incident report

- Application version:
- Windows version and architecture:
- Environment: Development / Packaged
- Subsystem: Frontend / Backend / Database / AI / Voice / Installer
- Expected behavior:
- Actual behavior:
- Exact error message:
- Steps to reproduce:
- Last known working version:
- Recent changes:
- Relevant sanitized logs:
- Commands executed:
- Root cause:
- Fix applied:
- Verification performed:
- Regression tests passed:
- Remaining limitations:

Do not include secrets, raw credentials, or private user data in the report.

---

15. Definition of done

A troubleshooting fix is complete only when:

- [ ] The original issue has been reproduced or reliably diagnosed.
- [ ] The root cause is understood or the remaining uncertainty is documented.
- [ ] A targeted fix has been applied.
- [ ] The original failing operation now succeeds.
- [ ] Relevant automated tests pass.
- [ ] No user data was unintentionally deleted.
- [ ] No security controls were weakened.
- [ ] Logs do not expose secrets.
- [ ] The packaged application remains functional when relevant.
- [ ] The resolution and verification steps are documented.

Final rule: Diagnose first, change the smallest necessary component, preserve user data, and verify the actual behavior after every fix. A command completing successfully is not sufficient evidence that the underlying JARVIS feature works correctly.