CONFIGURATION.md
JARVIS — Configuration and Environment Management
Status: Implementation specification
Application: JARVIS personal AI assistant
Primary platform: Windows
Desktop shell: Tauri 2
Frontend: React + TypeScript + Vite
Backend: Python + FastAPI
Database: SQLite with SQLAlchemy and Alembic
Configuration principle: Explicit, validated, environment-specific and secret-safe configuration.
--------------------
1. Purpose
This document defines how JARVIS configuration must be structured, loaded, validated, stored, changed and packaged.
The objectives are to:
• Separate development, testing and production settings.
• Prevent credentials from leaking into source code or frontend bundles.
• Ensure predictable application startup.
• Avoid conflicting configuration sources.
• Support optional and replaceable AI providers.
• Support local-first operation where the feature permits it.
• Make configuration errors understandable and recoverable.
• Keep packaged Windows installations independent of the developer's machine.
• Prevent upgrades from silently overwriting user settings.
This document specifies configuration behavior. Actual variable names and integration points must be reconciled with the inspected codebase before implementation.
2. Configuration Principles
2.1 One authoritative source per setting
Every setting must have one defined source of truth.
Examples:
• Python backend settings: a central backend settings module.
• Frontend build-time settings: Vite environment configuration.
• Tauri application capabilities: Tauri configuration files.
• User preferences: application-managed settings storage.
• Secrets: environment variables during development or an appropriate secure credential store in production.
• Database schema: SQLAlchemy models and Alembic migrations.
Do not maintain independent copies of the same setting in multiple files unless the duplication is generated and verified automatically.
2.2 Explicit environment selection
Support three logical environments:
• development
• testing
• production
Use a validated environment identifier. Reject unknown values rather than silently treating them as production or development.
Production builds must not inherit development-only settings.
2.3 Safe defaults
Every optional feature must have a safe default.
• Debug mode: disabled outside development.
• Remote AI providers: disabled until configured.
• Local backend network exposure: disabled.
• Unnecessary telemetry: disabled unless explicitly designed and disclosed.
• Automatic execution of generated code: disabled unless a separately secured capability is implemented.
• Destructive actions: require the applicable authorization and confirmation.
• Optional camera, microphone and computer-control integrations: inactive until explicitly invoked and authorized.
2.4 Missing configuration
A missing optional setting should disable only the dependent feature when safe.
A missing mandatory setting must produce a clear startup error.
Do not silently substitute fake credentials, unrestricted permissions, insecure transport or a different provider.
--------------------
3. Configuration Layers
JARVIS has several configuration layers.
Layer	Purpose	Examples
Build-time frontend	Values embedded when building the UI	Public app version, public feature flags
Tauri configuration	Native app packaging and permissions	App identifier, window settings, capability scopes
Backend environment	Process-level configuration	Environment, log level, data directory
Application settings	User-controlled preferences	Theme, selected provider, default model
Secret storage	Sensitive credentials	API keys, refresh tokens
Database configuration	Persistent data access	SQLite location, migration settings
Test configuration	Isolated testing	Temporary database, fake providers
Do not use frontend build variables as a secure store. Values embedded in frontend code or bundles must be treated as publicly inspectable.
--------------------
4. Suggested Repository Layout
Adapt this layout to the existing repository. Do not create duplicate files if equivalent configuration already exists.
JARVIS/ ├── .env.example ├── .gitignore ├── pyproject.toml ├── package.json ├── package-lock.json ├── frontend/ │ ├── .env.development │ ├── .env.production │ └── ... ├── src-tauri/ │ ├── tauri.conf.json │ ├── capabilities/ │ └── ... ├── backend/ │ ├── app/ │ │ ├── config.py │ │ ├── main.py │ │ └── ... │ └── tests/ ├── config/ │ └── ... └── docs/ └── ...
The exact directory arrangement depends on the actual Vite root, Tauri setup and Python package layout.
Keep deployment and user-data files outside tracked source directories where practical.
--------------------
5. Environment Variable Naming
Use a consistent naming convention.
Recommended backend prefix:
JARVIS_
Examples:
• JARVIS_ENV
• JARVIS_LOG_LEVEL
• JARVIS_DATA_DIR
• JARVIS_DATABASE_URL
• JARVIS_HOST
• JARVIS_PORT
Provider-specific credentials should be clearly named and handled only by the backend or secure credential integration.
Avoid generic names that may conflict with other applications or developer tools.
If the codebase already uses another prefix, retain the existing convention unless a migration is justified and tested.
--------------------
6. Root .env.example
Create a tracked .env.example containing only documentation and safe placeholders.
The following is a template, not a claim that every variable is already supported. The implementation must define which variables it actually consumes.
# JARVIS environment JARVIS_ENV=development JARVIS_LOG_LEVEL=INFO # Local application data # Leave unset to use the application's documented default. JARVIS_DATA_DIR= # Database # Leave unset to use the documented default SQLite location. JARVIS_DATABASE_URL= # Backend binding # Development only. Production packaging must use the # configured secure local IPC / loopback strategy. JARVIS_HOST=127.0.0.1 JARVIS_PORT= # AI provider selection # Empty means no remote provider has been selected. JARVIS_AI_PROVIDER= # Provider credentials # Add only credentials for providers supported by the implementation. # Do not paste real keys into this file. JARVIS_OPENAI_API_KEY= JARVIS_ANTHROPIC_API_KEY= JARVIS_GOOGLE_API_KEY= JARVIS_OPENROUTER_API_KEY= # Local model integration # Enable only when a supported local runtime is installed # and the endpoint has been validated. JARVIS_LOCAL_MODEL_ENABLED=false JARVIS_LOCAL_MODEL_BASE_URL= # Optional diagnostics JARVIS_ENABLE_DIAGNOSTICS=false
Important rules
1. Empty variables are not valid credentials.
2. Unsupported variables must not be presented as implemented features.
3. Do not commit a real .env file.
4. Do not include API keys in example commands, screenshots or test output.
5. Do not use fake-looking but syntactically valid credentials that could accidentally be sent to a provider.
6. Provider names and credential variable names must match the implemented adapter registry.
7. If the implementation uses a secure credential store instead of environment variables, document that behavior and do not require duplicate permanent secrets in .env.
The final .env.example must be reconciled against the actual configuration schema before release.
--------------------
7. .gitignore Requirements
Ensure that the repository excludes secrets, local databases, generated artifacts and machine-specific state.
At minimum, review patterns equivalent to:
# Secrets and environment files .env .env.* !.env.example # Python __pycache__/ *.py[cod] .venv/ venv/ .pytest_cache/ .mypy_cache/ .ruff_cache/ .coverage htmlcov/ # Frontend dependencies and generated output node_modules/ dist/ # Tauri build output src-tauri/target/ # Local application data and databases *.db *.sqlite *.sqlite3 *.db-wal *.db-shm # Local logs and temporary files *.log tmp/ temp/ # Test output test-results/ playwright-report/
Review these rules against the real project.
Do not ignore lockfiles. Files such as package-lock.json and the chosen Python dependency lockfile should be tracked according to the project's reproducible-build strategy.
Do not globally ignore legitimate project assets, migrations, fixtures or configuration templates.
If a developer accidentally commits a secret, revoke or rotate it. Adding it to .gitignore does not remove it from Git history.
--------------------
8. Python Backend Configuration
Use one authoritative settings module, for example backend/app/config.py.
Pydantic Settings may be used if compatible with the chosen dependencies.
The settings module should define:
• Environment name.
• Debug behavior.
• Logging level.
• Data directory.
• Database location or URL.
• Local API binding strategy.
• AI provider configuration.
• Request timeouts.
• Retry limits.
• Upload and payload size limits.
• Optional feature flags.
• Credential-store integration.
• Production validation rules.
8.1 Validation
Validate settings during startup.
Reject:
• Unsupported environment names.
• Invalid ports.
• Invalid URLs.
• Negative or unreasonable timeouts.
• Invalid retry limits.
• Invalid database configuration.
• Production settings that enable debug mode.
• Unsupported provider identifiers.
• Unsafe network binding.
• Missing mandatory configuration for an explicitly enabled feature.
Use typed values rather than repeatedly parsing strings throughout the application.
8.2 Startup behavior
Startup should follow this sequence:
8. Load the intended environment configuration.
9. Resolve defaults.
10. Validate types and constraints.
11. Determine the application data directory.
12. Initialize logging with redaction.
13. Initialize database connectivity and supported migrations.
14. Initialize only configured integrations.
15. Register routes and services.
16. Report readiness only when mandatory initialization has succeeded.
Optional provider failures should not necessarily prevent offline features from starting. Mandatory database or security initialization failures must not be silently ignored.
8.3 No scattered environment reads
Do not call os.getenv() throughout unrelated business logic.
Read process configuration through the central settings layer and pass validated settings to dependent services.
Exceptions may exist for narrowly scoped startup or platform integrations, but they must be deliberate and documented.
--------------------
9. Development Configuration
Development configuration is for local implementation and debugging.
Allowed development behavior may include:
• Detailed local diagnostics.
• Frontend hot reload.
• Python reload mode.
• Test provider adapters.
• Temporary test databases.
• Development-only API documentation.
• Local fake data.
Required restrictions:
• Never use production credentials in ordinary automated tests.
• Never disable authorization merely to simplify development.
• Never expose a development server to the public network by default.
• Do not package development settings into a production release.
• Do not log complete secrets or sensitive request bodies.
• Do not assume that local development makes unsafe file or command execution acceptable.
Development-only overrides must be explicit and easy to distinguish from production settings.
--------------------
10. Testing Configuration
The testing environment must be isolated from development and production data.
Required behavior:
• Use temporary or dedicated test databases.
• Use deterministic fake AI providers for normal CI.
• Use synthetic credentials.
• Disable real outbound side effects by default.
• Prevent tests from sending actual emails or messages.
• Use temporary directories for filesystem operations.
• Use bounded timeouts and retries.
• Restore state between tests.
• Make tests repeatable without relying on the developer's home directory.
The test environment must fail clearly if a test unexpectedly tries to use a real credential or a forbidden external service.
Real-provider tests, when necessary, must be explicitly selected and separately controlled.
--------------------
11. Production Configuration
Production refers to the installed Windows application and its packaged backend, not merely a Python process launched with a different environment variable.
Production configuration must:
• Disable debug mode.
• Disable development reloaders.
• Disable development-only routes and permissive settings.
• Use secure local communication.
• Restrict backend exposure to the intended interface.
• Use an approved secret-storage strategy.
• Keep application data in an appropriate per-user location.
• Validate database initialization and migrations.
• Redact secrets in logs.
• Enforce request and resource limits.
• Handle missing optional providers without inventing credentials.
• Avoid downloading and executing arbitrary dependencies during normal startup.
• Keep configuration changes separate from packaged executable files.
Production settings must not be copied blindly from the developer's .env file.
11.1 Local backend binding
If the backend uses HTTP:
• Bind to loopback unless another interface is explicitly required and secured.
• Do not default to 0.0.0.0.
• Authenticate protected local requests.
• Do not treat CORS as authentication.
• Avoid fixed, reusable authentication tokens in frontend bundles.
• Select and validate the listening port deliberately.
• Shut down the backend cleanly with the desktop application.
If Tauri IPC or another transport is selected instead, document the actual transport and its security controls.
11.2 Production debug information
Do not expose:
• Full tracebacks to ordinary users.
• Secret values in health endpoints.
• Local credential-store contents.
• Unrestricted diagnostic endpoints.
• Development stack traces through HTTP responses.
Keep detailed sanitized diagnostics in protected local logs.
--------------------
12. Frontend and Vite Configuration
Vite variables prefixed with VITE_ may be embedded into frontend output.
Therefore:
• Treat every frontend environment variable as public.
• Never put provider API keys in VITE_* variables.
• Never place private backend tokens in frontend build configuration.
• Do not expose filesystem paths or internal secrets through public build constants.
• Keep production build settings separate from development server settings.
• Restrict frontend API destinations to the supported backend integration.
• Avoid permissive cross-origin settings in production.
Safe public values might include a display version or a non-sensitive feature flag.
Provider authentication and secret handling must occur in the backend or an appropriate secure native integration.
12.1 Build-time versus runtime configuration
Build-time configuration is embedded into the frontend bundle.
Runtime configuration is read by the running application.
Use build-time values only for properties that genuinely must be fixed at build time. Use validated runtime configuration or application settings for user-editable preferences and supported provider selection.
Do not rebuild the entire desktop application simply to change a user preference unless the architecture explicitly requires it.
--------------------
13. Tauri Configuration
Keep native configuration in the established Tauri configuration files.
Document and validate:
• Product name and identifier.
• Application version.
• Window settings.
• Build commands.
• Frontend output directory.
• Backend sidecar strategy.
• Bundle targets.
• Required plugins.
• Capability definitions.
• Filesystem scopes.
• Shell permissions.
• Content Security Policy.
• Updater settings, if implemented.
13.1 Capability configuration
• Grant only necessary capabilities.
• Keep filesystem scopes narrow.
• Avoid unrestricted shell execution.
• Review every new plugin permission.
• Keep development-only capabilities out of production builds.
• Test that unauthorized native operations are rejected.
13.2 Packaging configuration
The packaged application must locate its bundled resources using supported application resource paths, not hardcoded developer-machine paths.
Do not assume the current working directory is the project root.
Test resource lookup from the installed application, including paths containing spaces and supported non-ASCII characters.
--------------------
14. Database and Data Directory Configuration
Use a documented per-user data location for persistent application state.
The exact Windows directory must be chosen according to the implemented Tauri/backend packaging design. Resolve it through an application-aware path strategy rather than hardcoding a developer's absolute path.
Configuration must define:
• Database location.
• Migration behavior.
• Backup location.
• Log directory.
• Temporary-file location.
• Media storage location, if supported.
• Cleanup and retention behavior.
Rules
• Do not store the production database inside the source repository.
• Do not place mutable data beside the executable if the installation directory may be read-only.
• Do not overwrite an existing database on startup.
• Do not run schema creation and migrations through conflicting mechanisms.
• Back up important data before high-risk migrations when appropriate.
• Test backup restoration.
• Document what happens to user data on uninstall.
Use one documented default per storage type, with explicit overrides only where supported.
--------------------
15. AI Provider Configuration
Provider configuration should be adapter-based and validated centrally.
For each supported provider, define:
• Provider identifier.
• Supported model identifiers.
• Authentication mechanism.
• Endpoint policy.
• Request timeout.
• Retry policy.
• Streaming support.
• Supported capabilities.
• Privacy/data-sharing behavior.
• Configuration validation.
• Error classification.
Do not assume that all providers expose the same API or support the same features.
15.1 Credentials
• Load development credentials from local environment configuration when supported.
• Prefer an appropriate secure credential store for persistent production credentials.
• Never expose keys to the frontend.
• Never print full keys in diagnostics.
• Do not silently substitute one provider's key for another provider's credential.
• Validate that a credential is configured before attempting authentication.
15.2 Model selection
A selected model must belong to a supported provider configuration.
If the selected model is invalid or unavailable:
17. Return a clear configuration or availability error.
18. Offer only explicitly configured fallback choices.
19. Preserve the existing permission and privacy policy.
20. Do not retry indefinitely.
21. Do not change providers silently when doing so changes data-sharing behavior.
15.3 Optional local models
A local model integration may be enabled only when a supported local runtime is configured.
Validate:
• The endpoint format.
• The expected protocol.
• Connectivity.
• Supported model identifiers.
• Timeouts.
• Local-network exposure risks.
Do not assume a local model endpoint is secure merely because it runs on the same machine.
--------------------
16. Timeouts, Retries and Resource Limits
Use explicit, configurable bounds for external and potentially long-running operations.
Examples include:
• Connection timeout.
• Request timeout.
• Maximum retry attempts.
• Maximum response size.
• Maximum upload size.
• Maximum concurrent tasks.
• Maximum task duration.
• Maximum streaming duration where supported.
Do not choose arbitrary limits without considering the relevant workflow. Define defaults from the actual requirements and test them.
Retry rules
• Retry only errors considered transient.
• Respect provider rate-limit responses where applicable.
• Use bounded backoff.
• Avoid retrying authentication failures indefinitely.
• Do not repeat non-idempotent actions blindly.
• Do not let cancellation be defeated by a retry loop.
A missing or invalid limit must not become an unlimited operation.
--------------------
17. Logging and Diagnostics Configuration
Define a central logging policy.
Supported settings may include:
• Log level.
• Log directory.
• Rotation size.
• Retention period.
• Console output in development.
• Diagnostic export behavior.
Production logging should default to a practical, non-verbose level.
Required safeguards
• Redact known secret patterns before writing logs.
• Avoid logging full prompts or conversations by default.
• Avoid logging complete request bodies containing private data.
• Restrict local log access.
• Limit log growth.
• Prevent untrusted text from forging structured audit entries.
• Ensure diagnostic exports are reviewed and sanitized.
Changing the log level must never disable authorization, auditing or error reporting.
--------------------
18. Configuration Precedence
Define precedence explicitly to avoid confusing or insecure overrides.
Recommended conceptual order:
22. Security-critical hard-coded application constraints.
23. Validated command-line or process overrides explicitly supported by the deployment.
24. Validated environment variables.
25. Persistent application settings.
26. Documented safe defaults.
This is a conceptual policy, not an instruction to let environment variables override every security constraint.
Security-critical restrictions—such as refusing unauthorized shell execution—must not be overridden by ordinary user preferences or an AI-generated configuration.
The actual precedence order for each setting must be documented in the implementation.
--------------------
19. Configuration Change and Reload Behavior
Not every setting can safely be changed at runtime.
Classify settings as:
• Startup-only: Requires application restart.
• Runtime-editable: Can be updated safely while the application runs.
• Build-time: Requires a new application build.
• Security-controlled: Requires explicit authorization and validation.
Examples:
• Theme preference: usually runtime-editable.
• Provider selection: runtime-editable if the adapter supports safe switching.
• Backend bind address: generally startup-only.
• Tauri capabilities: build-time or controlled deployment configuration.
• Secret-store changes: validated runtime or startup behavior depending on implementation.
• Database schema: migration-controlled.
When a change fails validation, preserve the last valid configuration and report the failure.
Do not partially apply a multi-setting change if that leaves the application in an inconsistent security state.
--------------------
20. Configuration Migration
When configuration formats change between versions:
• Identify the previous supported format.
• Validate existing settings before migration.
• Preserve compatible user preferences.
• Never log stored secrets during migration.
• Do not silently widen permissions.
• Keep a recoverable copy when the migration can cause data loss.
• Make migration idempotent where practical.
• Test migration using synthetic older-version configuration.
• Report unsupported formats clearly.
A new application version must not silently reset a user's provider selection, erase memory or replace existing settings with development defaults.
--------------------
21. Validation and Automated Tests
Implement configuration tests that cover:
Environment validation
• Supported environment names are accepted.
• Unknown environment names are rejected.
• Missing mandatory values produce clear errors.
• Optional missing values resolve to documented defaults.
• Invalid numeric values are rejected.
• Invalid URLs and ports are rejected.
• Production debug settings are rejected or forcibly disabled according to the documented policy.
Secret handling
• .env.example contains no real secrets.
• Provider credentials do not appear in frontend bundles.
• Configuration errors do not print credentials.
• Diagnostic exports redact secret patterns.
• Missing credentials do not trigger fabricated fallback values.
Network configuration
• The packaged backend does not bind to a public interface by default.
• Invalid host or port configuration fails safely.
• Local authentication remains required for protected requests.
• Development-only network settings are not inherited by production.
Database configuration
• The configured database location is resolved correctly.
• Parent directories are handled safely.
• Existing databases are preserved.
• Invalid or inaccessible paths produce actionable errors.
• Migrations run through the designated migration mechanism.
Packaging
• Required resources are found after installation.
• The application works without the developer's .env file.
• Production artifacts do not contain developer-specific paths or credentials.
• Runtime settings remain editable according to the documented design.
Run these tests as part of the testing process defined in TESTING.md.
--------------------
22. Startup Error Messages
Configuration errors should be specific enough to fix without exposing secrets.
Good examples:
• AI provider is not configured. Open Settings to select a supported provider.
• Database directory is not writable. Check the configured data directory permissions.
• Unsupported application environment. Use a supported environment value.
• Local backend initialization failed. Review the sanitized application log for details.
Avoid messages such as:
• Printing the entire environment.
• Printing full API keys.
• Dumping all configuration values.
• Showing full internal stack traces to ordinary users.
• Silently ignoring invalid settings.
Where possible, identify the setting name, explain the expected format and provide a safe next step.
--------------------
23. Configuration Change Workflow for Coding Agents
Before changing configuration:
27. Inspect existing configuration files and settings code.
28. Identify the current source of truth for each affected setting.
29. Check whether the setting is used by the frontend, backend, Tauri or packaging process.
30. Update the schema, defaults and validation consistently.
31. Update .env.example only for variables actually supported.
32. Add tests for valid, invalid and missing values.
33. Verify that secrets cannot reach frontend output or logs.
34. Run the relevant tests and build checks.
35. Review the packaged behavior if the change affects production startup.
36. Report actual outcomes and unresolved issues.
Do not create duplicate settings modules, conflicting environment files or a second database configuration system merely to satisfy a template.
--------------------
24. Production Configuration Acceptance Checklist
Before declaring configuration implementation complete:
• [ ] One authoritative settings source exists for each setting.
• [ ] Development, testing and production behavior are distinguishable.
• [ ] .env.example contains only safe placeholders.
• [ ] .gitignore excludes real secrets and local mutable data.
• [ ] Frontend variables contain no private credentials.
• [ ] Backend configuration is validated at startup.
• [ ] Optional integrations fail gracefully when unconfigured.
• [ ] Mandatory initialization failures prevent unsafe startup.
• [ ] Provider selection and fallback follow explicit policy.
• [ ] Local backend exposure is restricted and authenticated.
• [ ] Data and log directories resolve correctly on Windows.
• [ ] Database migrations do not silently overwrite user data.
• [ ] Production logs are sanitized.
• [ ] Configuration changes preserve the last valid state on failure.
• [ ] Packaged startup works without developer-only files.
• [ ] Relevant automated tests have actually passed.
• [ ] Unverified or blocked checks are reported honestly.
--------------------
25. Final Rule
Configuration must be explicit, validated and reproducible.
Never assume a variable is implemented merely because it appears in .env.example. Never assume a successful development launch proves that the packaged application is configured correctly.
A configuration feature is complete only when its implementation, documented defaults, validation, security boundaries and relevant tests agree.