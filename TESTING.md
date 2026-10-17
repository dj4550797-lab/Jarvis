TESTING.md
JARVIS — Testing Strategy, Quality Gates and Acceptance Criteria
Document status: Implementation and release testing specification
Primary platform: Windows
Architecture: Tauri 2, React, TypeScript, Vite, Python FastAPI, SQLAlchemy, SQLite and Alembic
Purpose: Define how JARVIS functionality, reliability, security, compatibility and packaging are verified.
--------------------
1. Purpose
This document establishes the mandatory testing approach for JARVIS throughout development.
The goal is to detect defects early, verify that components work together, prevent regressions, and establish objective evidence before features or releases are declared complete.
Testing must cover:
• Frontend behavior and rendering.
• Backend APIs and business logic.
• Database operations and migrations.
• AI-provider adapters and fallback behavior.
• Persistent memory.
• Skills and permission enforcement.
• Voice, device and vision integrations.
• Computer-control operations.
• Background tasks and agent recovery.
• Application startup, shutdown and diagnostics.
• Windows packaging, installation, upgrade and uninstall.
• Privacy, security and failure recovery.
This document defines how correctness is verified. Feature scope remains defined by PRD.md; implementation sequencing remains defined by PLAN.md.
2. Core Testing Principles
2.1 Evidence-based results
A test may be reported as passed only when it has actually executed and its result has been inspected.
The following statuses must remain distinct:
• PASS: Executed successfully against the defined criteria.
• FAIL: Executed and did not meet the criteria.
• BLOCKED: Could not run because a dependency, environment or prerequisite was unavailable.
• NOT RUN: Has not been executed.
• NOT APPLICABLE: Does not apply to the current feature or release, with a documented reason.
• IN PROGRESS: Execution or investigation is still underway.
A test that was written but not executed is not a passing test.
A successful development build does not prove that the application works correctly after packaging.
2.2 Test at multiple levels
Use the lowest-cost test level that adequately verifies the behavior, then add integration or end-to-end coverage where needed.
• Unit tests validate isolated logic.
• Integration tests validate interactions between components.
• API tests validate contracts and authorization.
• UI tests validate user-visible behavior.
• End-to-end tests validate important complete workflows.
• Security tests validate boundaries and adversarial conditions.
• Release tests validate the packaged application in its target environment.
2.3 Deterministic testing
Automated tests must not depend unnecessarily on real AI providers, live websites, personal files or external services.
Use fakes, mocks, fixtures and local test services wherever possible.
Real-provider and real-device tests belong in separately identified integration or manual test suites.
2.4 Safe test environments
Never use real credentials, personal conversation history, important user documents or production databases in destructive tests.
Tests that write files, execute commands, capture devices or send messages must use controlled test resources and explicit safeguards.
2.5 No arbitrary coverage guarantees
Coverage is a measurement, not proof of correctness.
Start with meaningful coverage for security-sensitive and business-critical code. Set numeric thresholds only after the test infrastructure and repository baseline are established.
--------------------
3. Testing Technology
Use the following tools where compatible with the inspected project configuration.
Area	Recommended tooling
Python unit and integration tests	pytest
Python async tests	pytest-asyncio, when needed
API testing	FastAPI test client and HTTPX
Python mocking	unittest.mock or pytest fixtures
Frontend unit tests	Vitest
Frontend component tests	React Testing Library
Frontend DOM environment	jsdom or another compatible test environment
Browser-level tests	Playwright, when justified
Type checking	TypeScript compiler
Frontend linting	Configured ESLint rules
Python linting	A configured tool such as Ruff
Python type checking	A configured tool such as mypy or Pyright
Database migrations	Alembic migration checks and test databases
Dependency auditing	Suitable package audit and vulnerability tools
Windows installer verification	Windows test environment and scripted smoke tests
Coverage reporting	Coverage.py and Vitest coverage tooling
Do not add every tool automatically. Inspect the existing dependency and build configuration first, select compatible versions, and avoid maintaining duplicate configuration sources.
Lockfiles must remain consistent with the chosen package-management strategy.
--------------------
4. Test Repository Organization
Adapt the exact directories to the existing repository rather than blindly duplicating its structure.
A suggested layout is:
JARVIS/ ├── frontend/ │ └── src/ │ ├── components/ │ ├── features/ │ └── ... ├── src-tauri/ │ └── ... ├── backend/ │ ├── app/ │ │ ├── api/ │ │ ├── ai/ │ │ ├── memory/ │ │ ├── skills/ │ │ ├── permissions/ │ │ ├── tasks/ │ │ ├── database/ │ │ └── ... │ └── tests/ │ ├── unit/ │ ├── integration/ │ ├── api/ │ ├── security/ │ └── fixtures/ ├── tests/ │ ├── e2e/ │ ├── release/ │ └── fixtures/ └── ...
Possible test filenames:
• test_ai_router.py
• test_provider_fallback.py
• test_memory_service.py
• test_permissions.py
• test_skills.py
• test_database_migrations.py
• test_api_authentication.py
• test_task_cancellation.py
• permissions.test.tsx
• chat_streaming.test.tsx
• settings.test.tsx
• app-startup.spec.ts
Use names appropriate to the actual modules. Do not create placeholder tests that always pass simply to make a directory or coverage report appear complete.
--------------------
5. Test Levels and Acceptance Criteria
5.1 Unit tests
Test functions, classes and services in isolation.
Required examples:
• Configuration validation.
• Permission evaluation.
• Input schema validation.
• Provider selection.
• Retry and timeout logic.
• Memory record validation.
• Task state transitions.
• Path normalization.
• Error classification and redaction.
• Frontend state transformations.
• UI validation and accessibility behavior.
Acceptance criteria
• Tests verify both expected results and meaningful failure cases.
• Tests do not require live provider credentials.
• Results are deterministic under controlled inputs.
• Important edge cases are covered.
• A failure identifies the relevant test and component.
5.2 Integration tests
Test communication between actual components using controlled local dependencies.
Examples:
• FastAPI routes connected to application services.
• SQLAlchemy services connected to a temporary SQLite database.
• Database migrations applied to a test database.
• AI router connected to fake provider adapters.
• Skill executor connected to the real permission service.
• Task scheduler connected to task persistence.
• Frontend API client connected to a local test server.
Acceptance criteria
• Component contracts match the documented interfaces.
• Database writes and reads behave correctly.
• Authorization is enforced across component boundaries.
• Failure in one component does not silently bypass another component's checks.
• Temporary resources are cleaned up after each test.
5.3 API tests
Validate the HTTP contract independently of the visual interface.
Cover:
• Valid requests and responses.
• Invalid request bodies and query parameters.
• Missing, malformed, expired or invalid local authentication.
• Unsupported HTTP methods.
• Oversized payloads.
• Unauthorized resource access.
• Error responses and safe error messages.
• Rate limiting where implemented.
• Timeouts and dependency failures.
• Production-disabled debug endpoints.
Acceptance criteria
Every protected endpoint must have tests for permitted and denied access. The exact expected status codes and response schemas must match the implemented API contract.
5.4 UI tests
Test user-visible behavior rather than internal implementation details.
Cover:
• Application startup and loading states.
• Chat submission and streamed output.
• Provider selection and configuration validation.
• Memory viewing, editing and deletion.
• Skill activation and permission displays.
• Confirmation dialogs for sensitive operations.
• Error notifications and retry controls.
• Task status, cancellation and recovery.
• Responsive layouts and keyboard navigation.
• Empty, loading, success and failure states.
Acceptance criteria
Controls must perform their advertised actions. Errors must be understandable. Sensitive actions must not become executable merely because a dialog was dismissed or a frontend state was manipulated.
5.5 End-to-end tests
Test a small set of high-value workflows through the running application.
Recommended workflows:
1. Launch the application and open the main interface.
2. Send a message to a fake AI provider and receive a response.
3. Switch between configured fake providers and verify fallback behavior.
4. Save a test memory, retrieve it and delete it.
5. Attempt an unauthorized skill action and verify that it is blocked.
6. Request a protected computer operation and verify the confirmation flow.
7. Cancel a background task and verify its final state.
8. Restart the application and verify the expected persistence behavior.
9. Trigger a simulated backend failure and verify recovery messaging.
Acceptance criteria
The workflow reaches its expected final state, authorization remains enforced throughout, and no test depends on an unapproved real-world side effect.
--------------------
6. AI Provider and Model-Routing Tests
AI responses are variable, so tests must separate application correctness from model quality.
6.1 Fake provider tests
Create deterministic fake providers that can simulate:
• Successful text responses.
• Streamed responses.
• Empty responses.
• Malformed structured output.
• Authentication errors.
• Rate-limit responses.
• Network timeouts.
• Connection failures.
• Provider overload.
• Invalid model identifiers.
• Partial streams and interrupted connections.
• Responses that arrive after cancellation.
Acceptance criteria
• The router selects a valid configured provider.
• Invalid configurations fail with actionable errors.
• Retry behavior respects configured limits.
• Fallback uses only permitted providers.
• Secrets are not included in user-visible errors.
• A provider timeout does not cause unlimited waiting.
• Interrupted streams terminate cleanly.
• Sensitive actions are not duplicated because a response was interrupted.
6.2 Model-quality evaluation
Use a versioned, synthetic evaluation dataset for representative assistant tasks.
Measure relevant properties such as:
• Task success.
• Factual consistency against known expected results.
• Structured-output validity.
• Instruction adherence.
• Refusal behavior for prohibited or unauthorized operations.
• Latency and token usage, when available.
• Failure rate under simulated provider errors.
For non-deterministic model evaluations, define tolerances and repeat counts where appropriate. Do not require identical natural-language wording unless the test uses a deterministic fake.
6.3 Real-provider tests
Real-provider tests must be explicitly marked and must use approved credentials.
• Keep them separate from ordinary offline CI.
• Apply budget, request and time limits.
• Never expose credentials in test output.
• Avoid sensitive personal data.
• Record the provider and model configuration needed to interpret results.
• Treat provider availability as an external dependency, not a deterministic unit-test result.
Important: A successful fake-provider test proves the application integration logic for that scenario. It does not prove that a real provider account, quota, endpoint or model is available.
--------------------
7. Memory and Database Tests
7.1 Memory tests
Test:
• Valid memory creation.
• Invalid memory rejection.
• Retrieval by supported filters.
• Updates and deletion.
• Isolation between unrelated records or users, where applicable.
• Duplicate-record behavior.
• Missing or deleted references.
• Persistence across application restarts.
• Error handling when the database is unavailable.
• Enforcement of memory-access permissions.
Acceptance criteria
Memory operations must match the application's documented persistence and deletion semantics. Deleted records must not remain available through the normal memory retrieval path or derived indexes that the application controls.
7.2 SQLite and SQLAlchemy tests
Use temporary databases or isolated test database files.
Test:
• Schema creation.
• Transaction commit and rollback.
• Foreign-key constraints.
• Uniqueness constraints.
• Concurrent access and lock handling.
• Database corruption or unavailable-file errors.
• Parameterized queries.
• Migration from supported earlier schemas.
• Upgrade failure handling.
• Backup and restoration.
Never run migration tests against the user's actual production database.
7.3 Migration acceptance criteria
• Every migration applies successfully to its supported starting schema.
• The migrated schema matches the expected current schema.
• Important existing data remains intact.
• Failed migrations do not silently report success.
• Backup and recovery procedures are tested where migration risk warrants them.
• Unsupported upgrade paths are documented.
Do not assume that an empty database test proves an upgrade from an existing installation works.
--------------------
8. Permission and Security Tests
Coordinate with SECURITY.md; this section specifies the test obligations, not a replacement security policy.
8.1 Authorization matrix
Create tests for every implemented sensitive capability.
Scenario	Expected result
Permission not granted	Deny
Unknown tool or skill	Deny
Invalid authorization token	Deny
Expired approval	Deny
Revoked permission	Deny
Invalid tool arguments	Reject
Authorized read within scope	Allow
Write outside permitted scope	Deny
Provider fallback	Preserve existing permissions
AI output asks to bypass policy	Deny
Confirmation is cancelled	Do not execute
User disables a capability	Prevent future unauthorized execution
8.2 Prompt-injection tests
Use synthetic malicious instructions embedded in:
• Webpage text.
• PDF or document content.
• Code comments.
• Tool results.
• Chat messages.
• OCR text from sample images.
Test whether the application maintains the distinction between untrusted content and trusted instructions.
Acceptance criteria: Retrieved content must not grant permissions, modify trusted policy or trigger unauthorized actions. The test must verify actual enforcement, not merely that the model says it ignored the attack.
8.3 Filesystem and command tests
Where these capabilities are implemented, test:
• Path traversal.
• Windows drive-letter and UNC paths.
• Symlink-related edge cases.
• Unauthorized file access.
• Protected-directory access.
• Malformed shell arguments.
• Command timeout and cancellation.
• Output-size limits.
• Failure to launch a process.
• Attempted execution without required approval.
Use temporary directories and harmless test commands. Never run destructive tests against the real user profile.
8.4 Secret-leakage tests
Check that representative exceptions and diagnostic exports do not reveal:
• API keys.
• Authorization headers.
• Session tokens.
• Passwords.
• Encryption keys.
• Sensitive file contents.
Use synthetic secret strings as test fixtures and assert that those exact values do not appear in captured logs or responses.
--------------------
9. Voice, Camera and Device Tests
Run these tests only when the corresponding feature is implemented.
Voice and audio
• Missing microphone.
• Permission denied.
• Unsupported input device.
• Empty audio input.
• Very long audio input.
• Speech-recognition timeout.
• TTS engine unavailable.
• Device disconnection during capture.
• Stop/cancel during recording.
• No-audio and low-quality-audio conditions.
Camera and screenshots
• Permission denied.
• No camera available.
• Camera disconnect.
• Invalid image format.
• Oversized image.
• Screenshot capture failure.
• Cancellation during capture.
• Failure to save or process media.
• Unauthorized upload attempt.
Acceptance criteria
Failures are reported clearly, active capture stops when requested where technically possible, and denied permissions do not trigger covert retries. Tests must not activate real devices without the test operator's knowledge.
--------------------
10. Background Tasks and Recovery Tests
Test task lifecycle transitions such as:
PENDING → RUNNING → SUCCEEDED
and failure or cancellation paths supported by the implementation.
Cover:
• Task scheduling.
• Duplicate scheduling.
• Timeout.
• Cancellation before execution.
• Cancellation during execution.
• Application shutdown during a task.
• Backend restart.
• Provider failure.
• Retry limits.
• Retry exhaustion.
• Persistent task-state recovery.
• Permission revocation during a task.
• Failure of the recovery handler itself.
Acceptance criteria
• Tasks do not retry indefinitely.
• Cancellation prevents future cancellable actions.
• Non-idempotent operations are not blindly repeated.
• Uncertain external outcomes are recorded as unknown until verified.
• Recovery does not bypass authorization.
• Failed tasks retain enough sanitized diagnostic information for investigation.
--------------------
11. Performance and Resource Tests
Performance targets must be established from actual product requirements and measured baselines rather than invented guarantees.
Measure:
• Cold startup time.
• Warm startup time.
• UI responsiveness.
• Backend response latency.
• Time to first streamed token.
• Total response duration.
• Memory usage while idle.
• Memory usage during representative workloads.
• CPU usage during background operation.
• Database query latency.
• Large-file and long-conversation behavior.
• Cancellation responsiveness.
Separate application overhead from external model latency.
Acceptance criteria
• Measurements are reproducible enough to compare releases.
• Performance regressions are investigated against an established baseline.
• Long-running tasks have time and resource limits where appropriate.
• The application remains usable when a remote provider is slow.
• No fixed response-latency guarantee is made for an external AI service.
Test on documented Windows hardware and record the operating system, machine class, build type and relevant configuration.
--------------------
12. Reliability and Fault-Injection Tests
Simulate expected operational failures.
Examples:
• Backend process exits unexpectedly.
• Database becomes unavailable.
• Disk write fails.
• Configuration is missing or malformed.
• AI provider returns an error.
• Network connectivity disappears.
• Stream ends unexpectedly.
• A dependency import fails.
• A background task raises an exception.
• A corrupted state file is encountered.
• An application restart occurs during a pending task.
Acceptance criteria
• Failures are surfaced instead of silently ignored.
• The application does not enter an uncontrolled retry loop.
• Recoverable failures can be retried safely.
• Irrecoverable failures produce actionable diagnostics.
• Existing user data is not silently overwritten or deleted.
• Startup validation identifies required missing configuration before dependent functionality is used.
Fault injection must be isolated from ordinary user data.
--------------------
13. Accessibility and UI Compatibility
Test relevant accessibility and usability behavior:
• Keyboard-only navigation.
• Visible focus indicators.
• Dialog focus handling.
• Accessible names for interactive controls.
• Appropriate text contrast.
• Screen-reader labels for important actions.
• Readable error messages.
• Resizing and supported display scaling.
• Long text and large font behavior.
• Empty and loading states.
Where feasible, include automated accessibility checks and manual verification.
Acceptance criteria
Core workflows remain usable without relying exclusively on a mouse, and critical errors or confirmation requirements are not communicated solely through color.
--------------------
14. Windows Packaging and Installer Tests
The packaged application must be tested independently from the development environment.
14.1 Build verification
Verify that:
• The Tauri frontend build completes.
• The Python backend is packaged according to the selected deployment strategy.
• Required runtime components are present.
• No development-only configuration is included.
• No real credentials or personal databases are bundled.
• Installer artifacts are generated at the expected paths.
• Build logs contain no unexplained packaging failures.
A successful compilation alone does not satisfy release acceptance.
14.2 Installation scenarios
Test as applicable:
10. Fresh installation on a clean or isolated Windows environment.
11. First launch without developer tools installed.
12. Launch as a standard, non-administrator user.
13. Missing optional AI configuration.
14. Invalid AI configuration.
15. Missing optional hardware.
16. Application shutdown and restart.
17. Upgrade from a supported earlier version.
18. Recovery after an interrupted upgrade.
19. Uninstall behavior.
20. Reinstallation.
21. User-data preservation and explicit deletion behavior.
14.3 Packaged runtime checks
Verify:
• The desktop frontend opens.
• The backend starts and becomes available.
• Frontend-to-backend communication is authenticated.
• The backend is not unintentionally exposed on a network interface.
• Application logs are written to the intended location.
• Database initialization and migrations work.
• Provider errors are handled safely.
• The app closes without leaving unexpected child processes.
• The app starts again after a normal restart.
14.4 Release acceptance criteria
A Windows release cannot be marked ready until:
• The installer exists and its exact artifact path is verified.
• The application installs in the target environment.
• The installed application launches successfully.
• Core offline functionality is verified.
• The configured AI workflow is tested using a fake provider and, where required, an approved real provider.
• Persistence and database migration behavior are verified.
• Security-sensitive actions enforce their expected permission and confirmation rules.
• No unresolved release-blocking failure remains.
• Any untested scenario is reported as NOT RUN or BLOCKED.
--------------------
15. Continuous Integration
CI should run predictable checks on relevant changes.
Recommended pipeline:
22. Check out the repository.
23. Set up the supported Python version.
24. Install locked backend dependencies.
25. Run backend lint and type checks.
26. Run backend unit tests.
27. Run backend integration and API tests.
28. Set up the supported Node.js version.
29. Install frontend dependencies from the lockfile.
30. Run frontend lint and type checks.
31. Run frontend unit and component tests.
32. Build the frontend.
33. Run Tauri checks supported by the CI environment.
34. Run applicable dependency and secret scans.
35. Publish test and coverage reports as CI artifacts where appropriate.
Windows-specific packaging and smoke tests should run on an appropriate Windows runner or controlled Windows test machine.
Do not make ordinary CI depend on real provider API keys.
CI acceptance criteria
• Required jobs report their real results.
• A failed required check causes the workflow to fail.
• A skipped or unavailable security check is not reported as passed.
• Secrets are not exposed in CI logs.
• Lockfile changes are validated.
• Test reports identify failures clearly.
• Optional external-provider tests are explicitly separated from mandatory offline checks.
The exact workflow belongs in the repository's CI configuration. This document defines what the workflow should verify.
--------------------
16. Test Data and Fixtures
Use fixtures that are deterministic, minimal and isolated.
Examples:
• Fake AI provider responses.
• Synthetic conversation histories.
• Synthetic memory records.
• Temporary SQLite databases.
• Temporary filesystem directories.
• Fake authentication tokens.
• Synthetic documents containing malicious instructions.
• Controlled mock device responses.
• Fake task schedulers or clocks where needed.
Rules:
• Never commit real API keys.
• Never include real private conversations as default fixtures.
• Never use production data for destructive tests.
• Clean up temporary files and test processes.
• Make tests repeatable without manual cleanup.
• Ensure tests do not depend on a particular test execution order.
--------------------
17. Test Isolation and Flakiness
Tests must not pass or fail based on accidental shared state.
• Use temporary databases where appropriate.
• Reset mutable state between tests.
• Avoid arbitrary sleeps when event-based synchronization is possible.
• Use controlled clocks for expiration and scheduling tests.
• Mock unstable external dependencies.
• Apply bounded waits and timeouts.
• Avoid tests that rely on the developer's home directory or machine-specific paths.
• Keep parallel tests isolated from one another.
• Record flaky failures rather than silently rerunning until a pass appears.
Retries may help diagnose transient infrastructure problems, but must not hide a reproducible product defect.
--------------------
18. Coverage and Quality Gates
Coverage thresholds must be introduced deliberately after a baseline is measured.
Prioritize coverage for:
36. Authorization and permission evaluation.
37. Secret redaction.
38. Input validation.
39. Provider routing and fallback.
40. Database writes and migrations.
41. Filesystem access restrictions.
42. Task cancellation and retry logic.
43. Error handling and recovery.
44. Sensitive-action confirmation flows.
For security-sensitive logic, test important branches and negative cases, not only successful execution.
A line-coverage percentage must not be used as the only release criterion.
A test suite that executes many lines but does not verify expected behavior is insufficient.
--------------------
19. Defect Management and Regression Tests
Every confirmed defect should receive:
• A concise description.
• Reproduction steps.
• Expected and actual behavior.
• Severity and impact.
• Affected component or version.
• A regression test where practical.
• Verification of the fix.
• A record of any remaining limitation.
For serious defects, add the regression test before or alongside the fix when feasible.
A defect must not be marked fixed merely because the application starts. Verify the originally failing scenario and related regression cases.
--------------------
20. Feature Completion Criteria
A feature is considered test-complete only when all applicable conditions are satisfied:
• Its expected behavior is documented.
• Unit tests cover important logic and edge cases.
• Integration tests cover relevant component boundaries.
• API and UI tests cover the user-visible contract where applicable.
• Permission checks are verified for sensitive capabilities.
• Failure paths are tested.
• Relevant automated checks pass.
• Known limitations are documented.
• Test results can be reproduced.
• No mandatory test is silently treated as passed when it was not run.
Features requiring physical devices or external services may have a separate integration status. Clearly distinguish code-complete, locally tested, externally verified and release-ready states.
--------------------
21. Release Test Report Template
Create a report for every release candidate.
Release metadata
• Version:
• Commit identifier:
• Build date:
• Target platform:
• Windows version:
• Build configuration:
• Installer artifact path:
• Test environment:
Results
Test area	Status	Evidence or report
Backend unit tests	NOT RUN	
Backend integration tests	NOT RUN	
API authorization tests	NOT RUN	
Frontend tests	NOT RUN	
Type checks and lint	NOT RUN	
Database migration tests	NOT RUN	
Security tests	NOT RUN	
Dependency and secret scans	NOT RUN	
Frontend and backend build	NOT RUN	
Packaged application smoke test	NOT RUN	
Windows installation test	NOT RUN	
Upgrade and data-preservation test	NOT RUN	
Recovery and shutdown test	NOT RUN	
Replace each default status only after obtaining evidence.
Defects and limitations
• Open release-blocking defects:
• Accepted risks and decision owner:
• Blocked or skipped tests:
• Known limitations:
• Follow-up actions:
Final decision
Choose one:
• PASS — READY FOR THE DEFINED RELEASE SCOPE
• FAIL — RELEASE BLOCKED
• CONDITIONAL — EXPLICITLY DOCUMENTED EXCEPTIONS
• NOT VERIFIED — INSUFFICIENT TEST EVIDENCE
A conditional release must document its exceptions, rationale, owner and mitigation. A blocked mandatory security test must never be represented as a passing result.
--------------------
22. Implementation Rules for Coding Agents
Any AI coding agent implementing JARVIS must:
45. Inspect the existing repository and testing setup before creating new test infrastructure.
46. Reuse established fixtures, helpers and configuration where appropriate.
47. Avoid creating duplicate test runners or conflicting dependency files.
48. Add tests for new behavior and regressions.
49. Run the relevant tests after a change.
50. Run broader required checks before declaring a phase or release complete.
51. Report actual commands, outcomes and unresolved failures.
52. Never fabricate test output, coverage, build success or installer paths.
53. Never skip a failing test simply to obtain a green result without a documented and reviewed reason.
54. Keep tests safe, isolated and independent of real personal data.
If a test cannot run because the environment lacks a required capability, record it as BLOCKED and state the missing prerequisite.
--------------------
23. Final Testing Standard
JARVIS must be judged by observable behavior and repeatable evidence.
A successful build is necessary but not sufficient. Passing unit tests do not prove integration correctness. A passing test suite does not prove that all security vulnerabilities have been eliminated. A development launch does not prove that the Windows installer works on a clean machine.
Final rule: Never claim that JARVIS is fully tested, production-ready or error-free unless the required checks for the stated release scope have actually been completed and their results reviewed.