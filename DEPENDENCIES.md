JARVIS — Dependencies & Environment Setup

File: "DEPENDENCIES.md"
Platform: Windows 10/11 x64
Frontend: Tauri 2 + React + TypeScript + Vite
Backend: Python + FastAPI
Database: SQLite + SQLAlchemy 2.x + Alembic
Purpose: Development, testing, packaging, and release dependency management

---

1. Purpose

This document defines the software dependencies, runtime requirements, installation procedures, compatibility checks, and maintenance rules for JARVIS.

The goals are to:

- Provide a repeatable Windows development environment.
- Keep frontend and Python dependencies isolated.
- Ensure the packaged application works without developer tools installed.
- Prevent dependency conflicts and unreviewed upgrades.
- Track security vulnerabilities and license obligations.
- Support reliable Tauri installer builds with a bundled FastAPI backend.

Important: Exact dependency versions must be selected and validated against the repository's lockfiles, source code, and supported Windows targets. This document does not claim that untested version combinations have been verified.

2. Dependency architecture

JARVIS
├── Desktop shell
│   ├── Rust
│   ├── Tauri 2
│   └── Windows WebView2
│
├── Frontend
│   ├── Node.js
│   ├── React
│   ├── TypeScript
│   └── Vite
│
├── Python backend
│   ├── Python
│   ├── FastAPI
│   ├── Uvicorn
│   ├── Pydantic
│   ├── SQLAlchemy 2.x
│   ├── SQLite
│   └── Alembic
│
├── Optional capabilities
│   ├── AI provider SDKs or HTTP clients
│   ├── Speech recognition
│   ├── Text-to-speech
│   └── Audio device libraries
│
└── Release tooling
    ├── Backend packager
    ├── Tauri bundler
    ├── Windows SDK / MSVC tools
    └── Code-signing tools, if used

Optional dependencies must only be included when the approved PRD and implemented features require them.

3. Required development tools

3.1 Windows

Use a supported Windows 10/11 x64 environment.

Required build tools may include:

- Git
- Node.js LTS compatible with the project
- The matching Node.js package manager
- Rust stable toolchain
- MSVC C++ build tools
- Windows SDK
- WebView2 Runtime or the approved runtime deployment method
- Python supported by the backend and packaging dependencies
- Tauri CLI
- Backend packaging tools, if required

The exact minimum Windows version must be stated in the release support policy.

3.2 Verify installed tools

Open PowerShell:

git --version
node --version
npm --version
rustc --version
cargo --version
py --version

Verify Rust configuration:

rustup show
rustup target list --installed

Check that the required Visual Studio Build Tools and Windows SDK are installed using the Visual Studio Installer or the appropriate Developer PowerShell.

Do not assume a tool is installed simply because its command exists on another development machine.

4. Frontend dependencies

4.1 Core packages

Package| Purpose| Required
React| UI component framework| Yes
React DOM| Browser UI rendering| Yes
TypeScript| Static type checking| Yes
Vite| Frontend development and production build| Yes
"@tauri-apps/api"| Frontend access to approved Tauri APIs| Yes, for API usage
"@tauri-apps/cli"| Tauri development and build commands| Yes, for npm-managed Tauri CLI

React, React DOM, TypeScript, Vite, and Tauri packages must use compatible versions selected by the project.

4.2 Optional frontend packages

Add libraries only when actual application code needs them.

Examples:

- Routing library, if multiple routed views are used.
- Form validation library, if needed beyond native validation.
- State management library, if React state/context is insufficient.
- UI component library, if approved by the design system.
- Icon library, if icons are not implemented using existing assets.
- Testing libraries for React component tests.
- Accessibility testing tools.

Avoid adding multiple libraries that solve the same problem without a documented reason.

4.3 Frontend installation

Run from the repository's frontend root:

npm ci

"npm ci" is appropriate when the project uses npm and commits "package-lock.json".

For pnpm or Yarn projects, use the package manager and frozen-lockfile command already established by the repository. Do not switch package managers during a release without a deliberate migration.

Inspect the available scripts:

npm run

Run the repository's actual commands for:

- Development.
- Production build.
- Linting.
- Type checking.
- Unit tests.
- Tauri build.

Do not invent missing scripts or assume that a successful build includes type checking and tests.

5. Python backend dependencies

5.1 Core runtime packages

Package| Purpose| Required
"fastapi"| HTTP API framework| Yes
"uvicorn"| ASGI server| Yes
"pydantic"| Request, response, and settings validation| Yes
"SQLAlchemy"| Database ORM and SQL toolkit| Yes
"alembic"| Database schema migrations| Yes
"python-dotenv"| Optional local environment-file loading| Conditional
"httpx"| HTTP client and common async testing client| Conditional
"pytest"| Python tests| Development/test
"pytest-asyncio"| Async tests when required| Conditional
"ruff"| Linting and formatting| Recommended development tool
"mypy" or an equivalent checker| Static analysis, if adopted| Conditional

Pin compatible versions in the project's dependency files after testing them.

5.2 Additional dependencies

Add only when needed:

- "aiosqlite" if using SQLAlchemy's async SQLite driver.
- "cryptography" if the implementation uses its cryptographic APIs.
- An AI provider SDK if direct SDK integration is selected.
- A maintained HTTP client if providers are accessed over HTTP.
- Audio libraries for implemented voice features.
- A packaging tool such as PyInstaller if used to bundle the backend.
- Windows-specific native dependencies when required by an approved feature.

Do not install both synchronous and asynchronous database drivers without a clear architecture requirement.

5.3 Python environment

Create an isolated virtual environment:

py -m venv .venv

Install dependencies through the environment's interpreter:

.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

Use the actual dependency filename if the repository uses a different file or a dedicated lock mechanism.

Verify:

.\.venv\Scripts\python.exe --version
.\.venv\Scripts\python.exe -m pip check
.\.venv\Scripts\python.exe -m pip list

Run the project's tests and verify that the backend imports and starts successfully.

Rule: Never rely on packages installed globally on a developer's machine.

6. SQLite and Alembic

6.1 SQLite

Python distributions for supported Windows environments commonly include SQLite support through the standard library.

Verify the runtime:

.\.venv\Scripts\python.exe -c "import sqlite3; print(sqlite3.sqlite_version)"

The required SQLite version depends on the SQL features and migration operations used by JARVIS. Validate it against the application's actual schema.

Do not install a separate SQLite executable unless the development or maintenance workflow explicitly requires one.

6.2 SQLAlchemy

Use SQLAlchemy 2.x APIs consistently.

Dependency responsibilities:

- Connection and engine management.
- ORM models.
- Session lifecycle.
- Transactions.
- Database constraints.
- Connection and query error handling.

Do not mix legacy SQLAlchemy patterns into new code without an explicit compatibility reason.

6.3 Alembic

Alembic manages database schema changes.

The repository must contain the configured migration environment and version scripts. Verify the configured migration location rather than assuming a particular directory.

Useful diagnostic commands, where supported by the project's configuration:

.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic heads
.\.venv\Scripts\python.exe -m alembic history

If the project uses a custom configuration or application factory, use its documented migration entry point instead.

Never delete the database or Alembic revision records as a routine dependency troubleshooting step.

7. Tauri and Rust dependencies

7.1 Rust

Rust is required to compile the Tauri desktop host.

Verify:

rustc --version
cargo --version
rustup show

Use the project's "rust-toolchain.toml" or other documented toolchain configuration if present.

Do not upgrade Rust automatically during a release without testing the resulting build.

7.2 Tauri packages

Keep these compatible:

- Tauri Rust crates.
- Tauri JavaScript API.
- Tauri CLI.
- Plugins used by the application.
- Capability and permission configuration.

If a Tauri plugin is used, verify that its Rust and JavaScript package versions are compatible with the project's Tauri 2 setup.

7.3 WebView2

JARVIS relies on the configured Windows web-rendering runtime.

Test the approved deployment approach on a clean supported Windows machine. If the runtime is not already available, the installer must handle its absence according to the release design.

Do not assume WebView2 is available simply because it exists on the developer's computer.

8. AI provider dependencies

AI integration may use direct HTTP requests, provider SDKs, or a compatible API layer.

The required dependencies depend on the selected implementation.

Dependency policy

- Use a maintained HTTP client for remote requests.
- Set connection and request timeouts.
- Handle rate limits and provider errors.
- Validate provider responses before returning them to the UI.
- Keep API credentials out of source code and frontend bundles.
- Avoid logging authorization headers or secret values.
- Implement retries only for appropriate transient failures.
- Do not automatically retry non-idempotent operations without a safe strategy.

Optional integrations

Do not make the whole desktop application depend on an AI SDK import if AI features can be isolated behind a provider interface.

When a provider is unavailable, JARVIS should display a controlled error rather than failing to launch.

Provider SDKs should be added only when their functionality justifies the extra maintenance and packaging burden.

9. Voice and audio dependencies

Voice functionality is conditional on the approved JARVIS feature set.

Possible categories include:

- Microphone capture.
- Audio playback.
- Speech-to-text.
- Text-to-speech.
- Audio device discovery.
- Optional wake-word detection.

Select libraries only after testing Windows support, supported Python versions, native DLL requirements, architecture compatibility, and licensing.

Voice dependency requirements

- Handle missing audio devices.
- Handle microphone permission denial.
- Recover from device changes where feasible.
- Report missing native libraries clearly.
- Avoid recording or transmitting audio without the expected user action and consent.
- Keep large model weights outside the installer unless local inference is an approved feature.
- Document whether a feature requires a network service or additional runtime download.

A voice dependency is not release-ready merely because it installs successfully on the developer's machine.

10. Development-only dependencies

Keep development tools separate from runtime dependencies wherever practical.

Examples:

- "pytest" and related test tools.
- Linting and formatting tools.
- Type checking tools.
- Frontend test frameworks.
- Mock servers and test fixtures.
- Build and packaging utilities not required at runtime.

The packaged JARVIS application should not require a development test environment to start.

Never include test API keys, test user data, local databases, or developer-specific environment files in the production package.

11. Dependency files and lockfiles

Use the dependency management mechanism established by the repository.

Suggested structure:

JARVIS/
├── package.json
├── package-lock.json
├── requirements.txt
├── requirements-dev.txt
├── pyproject.toml
├── rust-toolchain.toml
├── src-tauri/
│   ├── Cargo.toml
│   └── Cargo.lock
└── .gitignore

This is a suggested layout, not a requirement to create every file. Use the actual files that match the chosen tooling.

Rules

1. Commit applicable lockfiles.
2. Pin or constrain dependencies intentionally.
3. Review dependency upgrades.
4. Test after updating dependency files.
5. Keep production and development dependencies distinguishable.
6. Avoid duplicate dependency declarations that drift out of sync.
7. Document native system requirements.
8. Record toolchain versions used for release builds.
9. Rebuild and retest the installer after dependency changes.

Do not manually edit a generated lockfile as a substitute for a proper dependency update.

12. Secrets and environment configuration

Use environment variables or an approved secure storage mechanism for configuration and secrets.

A local ".env" file may be used for development if the application supports it, but it must not be treated as a secure production credential vault.

Example development-only configuration:

# Example keys only; never place real secrets in this template.
APP_ENV=development
LOG_LEVEL=INFO

Do not put real AI API keys in:

- Source files.
- Frontend environment variables that are bundled into public assets.
- Git commits.
- Installer resources.
- Public issue reports.
- Unredacted logs.

For production, use the approved user-level configuration and credential-storage design.

Verify ".gitignore" covers virtual environments, local databases, ".env" files, logs, build artifacts, and signing material where appropriate.

13. Backend packaging dependencies

If using PyInstaller or another packager:

- Pin the packaging tool version.
- Review the packaging specification.
- Include required resources explicitly.
- Test dynamic imports.
- Verify native extension and DLL dependencies.
- Include Alembic migration files when runtime migrations require them.
- Confirm the executable works outside the source repository.
- Test on a clean Windows environment without Python installed, when the product claims that support.

A successful packaging command is not proof that the backend is self-contained.

If the application uses a bundled Python runtime instead, document the runtime distribution, licensing, file layout, and launch command.

14. Installation workflow

14.1 New development environment

1. Install the required Windows build tools.
2. Clone the approved repository.
3. Check the project's documented Node.js and Python versions.
4. Install frontend dependencies from the lockfile.
5. Create the Python virtual environment.
6. Install Python dependencies.
7. Verify Rust and the Windows target.
8. Configure non-secret local settings.
9. Run database migrations using the documented workflow.
10. Run tests.
11. Launch the backend.
12. Launch the frontend/Tauri development application.
13. Verify frontend-to-backend communication.

14.2 Repeatable installation

Use clean, isolated environments and committed lockfiles. Avoid copying ".venv" directories or "node_modules" folders from another computer.

Recreate environments when changing Python versions or switching incompatible build environments.

15. Dependency verification checklist

Before a release build:

- [ ] Required Windows tools are installed.
- [ ] Toolchain versions are recorded.
- [ ] Frontend lockfile installation succeeds.
- [ ] Python dependencies install in a clean virtual environment.
- [ ] Python dependency consistency check passes.
- [ ] Rust dependencies compile.
- [ ] Tauri and plugin versions are compatible.
- [ ] SQLite runtime meets schema requirements.
- [ ] Alembic migrations are present and validated.
- [ ] AI provider dependencies are tested or safely optional.
- [ ] Voice dependencies are tested where applicable.
- [ ] Backend packaging includes required resources.
- [ ] No developer secrets or local data are bundled.
- [ ] Required automated tests pass.
- [ ] The final installer passes clean-machine testing.

16. Security and licensing

Maintain an inventory of direct and transitive dependencies.

For each release:

- Review security advisories for material vulnerabilities.
- Update dependencies through reviewed changes.
- Check package and native-library licenses.
- Preserve required license and attribution notices.
- Review bundled third-party executables and runtime distributions.
- Remove unused dependencies where practical.
- Verify that signing credentials remain protected.

Do not claim a release is vulnerability-free merely because no warnings were displayed by a single scanner.

Document known exceptions, their impact, mitigation, and approval.

17. Dependency troubleshooting

Python module not found

Check that the intended virtual environment is being used:

.\.venv\Scripts\python.exe -m pip show fastapi
.\.venv\Scripts\python.exe -m pip check

Install through the correct interpreter and rerun the relevant tests.

Frontend module not found

npm ci

Confirm the package is declared in the appropriate dependency section and the lockfile is current.

Rust compilation failure

rustc --version
cargo --version
rustup show

Check the compiler, Windows SDK, required target, and Tauri plugin compatibility. Preserve the original error output before changing versions.

SQLite or migration failure

Verify the SQLite runtime, database path, permissions, and Alembic configuration. Back up the database before any recovery operation.

Packaged backend fails

Run the packaged backend independently, inspect sanitized logs, and check missing resources, native DLLs, imports, and working-directory assumptions.

Do not fix a production packaging failure by silently adding dependencies to the developer's global Python installation.

18. Definition of Done

The dependency setup is ready when:

1. Required tools and supported versions are documented.
2. Frontend and Python dependencies install from controlled dependency files.
3. Rust/Tauri compatibility is validated.
4. Database migrations work for fresh installs and supported upgrades.
5. Optional AI and voice integrations fail gracefully when unavailable.
6. Backend packaging includes all required runtime components.
7. Security and licensing reviews are completed according to policy.
8. The packaged application passes clean-machine testing.
9. Release dependencies and toolchain versions are recorded.

Final rule: Do not label an untested dependency combination as verified. Record the actual version, environment, command, and observed result for each release.

---

Repository alignment note: Before using this document as the definitive dependency manifest, reconcile it with the actual "package.json", frontend lockfile, Python dependency files, Rust manifests, Tauri configuration, backend packaging specification, and approved JARVIS PRD.