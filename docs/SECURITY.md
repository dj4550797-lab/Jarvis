SECURITY.md

JARVIS — Security Policy and Implementation Standards

Document status: Implementation reference
Applies to: JARVIS desktop application, Python backend, frontend, AI integrations, skills, local data, packaged installer and future supported clients
Primary platform: Windows
Architecture: Tauri 2 + React + TypeScript + Python FastAPI + SQLite
Security principle: Deny by default, least privilege, explicit authorization, defense in depth.

---

1. Purpose and Scope

This document defines the mandatory security requirements for implementing, testing, packaging and maintaining JARVIS.

JARVIS is a local-first personal AI assistant that may interact with language models, persistent memory, local files, microphones, cameras, screenshots, notifications and approved computer-control tools.

These capabilities introduce risks involving privacy, credential theft, prompt injection, unauthorized computer operations, malicious content, data corruption and supply-chain compromise.

Every implementation must follow this policy.

1.1 Policy precedence

- "PRD.md" defines the product requirements.
- "PLAN.md" defines the implementation sequence and phase acceptance criteria.
- "GIT_WORKFLOW.md" defines repository operations and source-control safeguards.
- "SKILLS.md" defines skill architecture, registration, execution and skill-specific permissions.
- "SECURITY.md" defines cross-cutting security requirements.

When a conflict appears, do not silently choose an interpretation. Document the conflict and request a decision. Applicable platform security requirements and legal obligations must not be bypassed.

1.2 Security is not an optional feature

Security checks must be included in implementation and testing from the beginning. A feature must not be marked production-ready merely because its normal workflow works.

No implementation may claim that JARVIS is completely secure or has zero vulnerabilities.

---

2. Security Objectives

JARVIS must preserve:

1. Confidentiality: Private conversations, memories, files and credentials must not leak.
2. Integrity: AI-generated output must not silently alter protected files, settings, permissions or application state.
3. Availability: Malformed input, failed providers or runaway tasks must not permanently break the application.
4. Authorization: Every privileged action must be permitted by an enforceable policy.
5. Transparency: The user must understand when sensitive device access or consequential actions occur.
6. Recoverability: Important local data must have a tested backup and recovery mechanism.
7. Auditability: Security-relevant operations must produce useful, privacy-conscious records.
8. Data minimization: Collect and retain only information required for a defined feature.

---

3. Threat Model

3.1 Assets to protect

- AI provider API keys, tokens and other credentials.
- Conversation history, user memory and personal documents.
- Database contents, application settings and backups.
- Local files and folders accessible to JARVIS.
- Microphone, camera, screenshot and screen-capture data.
- Computer-control capabilities and registered tools.
- Installed skills, plugins, dependencies and executable components.
- Backend authentication material and local IPC communication.
- Build artifacts, signing credentials and release packages.

3.2 Threat actors and failure sources

The implementation must account for:

- Malicious or compromised websites and documents.
- Prompt injection embedded in user-supplied or retrieved content.
- A compromised or unreliable AI provider.
- Malicious or vulnerable third-party dependencies.
- An untrusted process on the same machine.
- Accidental exposure of secrets in logs or Git history.
- A malicious or incorrectly implemented skill.
- A user accidentally approving an unsafe action.
- Malformed requests, corrupted database files and unexpected exceptions.
- Unauthorized access by another local operating-system account.

3.3 Trust boundaries

Treat the following as separate trust domains:

1. React frontend and rendered content.
2. Tauri native application and operating-system APIs.
3. Python backend and its local API.
4. AI providers and remote services.
5. Retrieved websites, files, email, messages and other external content.
6. Skill code and other executable extensions.
7. Persistent memory, database records and logs.
8. Build tools, dependency registries and packaged artifacts.

Data crossing any boundary must be validated and authorized. Data must not become trusted merely because it was returned by an AI model, stored in the database or produced by another application component.

---

4. Security Architecture

4.1 Default-deny authorization

Every privileged operation must be denied unless a valid policy explicitly permits it.

- Unknown tools are denied.
- Unknown permissions are denied.
- Unregistered skills are denied.
- Invalid or missing authorization is denied.
- Expired approvals are denied.
- Unrecognized operation parameters are rejected.
- A provider failure must never disable permission checks.
- A fallback AI model must not receive greater privileges than the original model.

Authorization must be enforced by trusted application code, not by an AI model's self-reported decision.

4.2 Least privilege

Each component must receive only the capabilities it requires.

Examples:

- A research skill should not automatically receive filesystem-write access.
- A summarization task should not automatically receive computer-control permissions.
- A voice transcription component should not receive access to unrelated personal files.
- A model adapter should not have unrestricted access to application secrets.
- A background task should not inherit administrator privileges.
- A read-only tool must not be able to perform writes through another code path.

Do not run JARVIS as Windows Administrator for ordinary operation. Request elevated access only for a specifically justified operation, and do not design routine features around permanent elevation.

4.3 Separation of duties

The language model proposes actions; a trusted policy and execution layer decides whether those actions are allowed.

The model must not directly:

- Grant itself permissions.
- Modify permission policy to approve its own request.
- Read arbitrary environment variables or credential stores.
- Execute arbitrary shell commands without the approved execution flow.
- Bypass confirmation requirements.
- Disable auditing or security checks.
- Mark its own security tests as passed without actual test evidence.

---

5. Secret and Credential Management

5.1 Protected secrets

Secrets include, but are not limited to:

- AI provider API keys.
- OAuth access and refresh tokens.
- Application authentication tokens.
- Encryption keys.
- Signing certificates and private keys.
- Database credentials when a remote database is introduced.

Secrets must never be hardcoded in source code, committed configuration, frontend bundles, sample files, documentation, test fixtures or release artifacts.

5.2 Storage requirements

For development:

- Load secrets from environment variables or a local ".env" file excluded from version control.
- Supply only placeholder values in ".env.example".
- Restrict local file permissions where supported.
- Do not copy real ".env" values into generated configuration or logs.

For packaged Windows installations:

- Prefer Windows Credential Manager or an appropriately designed operating-system-backed secret store for persistent provider credentials.
- Use a vetted encryption library for any required application-level encryption.
- Keep encryption keys separate from the ciphertext they protect.
- Restrict access to local application data using Windows account permissions.
- Document recovery consequences before implementing key rotation or deletion.

Important: Encrypting a credential with a key stored beside the encrypted credential does not provide meaningful protection against an attacker who can read both files. Base64 encoding is not encryption.

The application must not promise protection against malware or an attacker who already controls the user's Windows account.

5.3 Key handling

- Generate cryptographically random keys using a secure cryptographic random-number generator.
- Never generate encryption keys from usernames, dates, machine names or predictable strings.
- Never print keys in logs or exception messages.
- Avoid unnecessary copies of secrets in memory.
- Redact credentials before formatting diagnostic reports.
- Never transmit secrets to an AI model as part of ordinary debugging context.
- Define a safe rotation and revocation procedure for every supported credential type.
- If a key is lost, explain whether encrypted data becomes unrecoverable before destructive recovery actions.

5.4 Secret exposure response

If a credential is exposed:

1. Stop further exposure where practical.
2. Revoke or rotate the affected credential.
3. Identify the affected logs, commits, artifacts and external services.
4. Remove exposed copies where possible without rewriting shared history recklessly.
5. Assess whether the credential was accessed or used.
6. Document remediation and add a regression check.

Deleting a secret from the latest commit does not make it disappear from Git history, cached logs, backups or previously published artifacts.

---

6. Local Backend and IPC Security

JARVIS uses a Tauri desktop frontend with a Python FastAPI backend. The local backend must not be treated as trusted merely because it runs on the same computer.

6.1 Network exposure

- Bind the backend to loopback only when network access is unnecessary.
- Never bind to "0.0.0.0" by default.
- Do not expose the backend through a public tunnel as part of ordinary startup.
- Disable unnecessary API documentation and debug endpoints in packaged production builds.
- Do not enable permissive cross-origin access for arbitrary origins.
- Do not assume CORS is authentication.

6.2 Local request authentication

If the frontend communicates with the backend over HTTP:

- Generate a high-entropy, per-session local authentication token.
- Deliver and store it through a controlled IPC or equivalent mechanism.
- Do not hardcode a reusable authentication token in the frontend bundle.
- Validate the token for protected requests.
- Avoid placing authentication tokens in URLs.
- Reject malformed, oversized and unauthorized requests.
- Apply reasonable rate limits to sensitive endpoints.
- Rotate session tokens when the backend restarts or the authenticated session is renewed.

Prefer an authenticated native IPC mechanism when appropriate and supported by the architecture. The selected implementation must document its threat model.

A loopback-only address is not sufficient protection against every local process.

6.3 Request validation

Use strict request schemas, such as Pydantic models, for backend inputs.

Validate:

- Data types and field lengths.
- Allowed enum values.
- File paths and file extensions.
- Numeric bounds and timeouts.
- Tool identifiers and permitted arguments.
- Request sizes and upload sizes.
- User-supplied URLs and redirect behavior.

Reject invalid inputs explicitly. Do not silently transform malformed security-sensitive requests into a different operation.

6.4 Production mode

Production builds must not expose interactive debuggers, development stack traces, unrestricted test endpoints or development-only secrets.

Unhandled exceptions must return a safe error response while retaining appropriate diagnostic information in protected logs.

---

7. Tauri and Frontend Security

7.1 Tauri capabilities

Configure Tauri capabilities and permissions explicitly.

- Grant only the plugins and commands needed by each application window.
- Avoid broad filesystem scopes.
- Do not grant unrestricted shell execution.
- Restrict native commands to validated inputs.
- Separate read and write operations where possible.
- Audit changes to the capability configuration.
- Test that unauthorized commands fail.

The frontend must never receive unrestricted native access merely to make implementation easier.

7.2 Content Security Policy

Configure an appropriately restrictive Content Security Policy (CSP) for the production application.

- Avoid unrestricted "unsafe-eval".
- Avoid broad wildcard script sources.
- Permit network connections only to required destinations where practical.
- Keep development-only exceptions out of production configuration.
- Review any relaxation of the CSP and document why it is necessary.

The final CSP must match the actual Tauri, frontend and provider architecture. Do not copy a generic policy without testing that it works securely.

7.3 Frontend rendering

- Render untrusted text as text rather than executable HTML.
- Sanitize HTML or Markdown when rich rendering is required.
- Do not use unsafe HTML injection for AI responses or retrieved pages.
- Do not evaluate model output as JavaScript.
- Do not place provider credentials in React environment variables that become browser-visible.
- Avoid exposing internal file paths, secrets and sensitive backend errors in the UI.

Frontend validation improves usability but does not replace backend authorization or validation.

---

8. AI-Specific Security

8.1 Treat model output as untrusted

An AI model can return incorrect, manipulated, malicious or malformed content.

Every generated action, tool argument, code suggestion and structured response must be validated before execution or persistence.

- Parse structured responses using explicit schemas.
- Reject unknown action types.
- Enforce limits on response length and execution time.
- Do not trust the model's claim that an action is safe.
- Do not allow a model to decide whether its own permissions are sufficient.
- Handle malformed output without crashing the application.

8.2 Prompt injection

Prompt injection can appear in websites, emails, PDFs, code repositories, images containing text, transcripts and other retrieved content.

JARVIS must:

1. Separate trusted system policy from untrusted content.
2. Clearly label retrieved content as data rather than instructions.
3. Prevent retrieved instructions from granting new permissions.
4. Validate tool calls independently of model reasoning.
5. Require appropriate approval before consequential actions.
6. Avoid sending unrelated memory or files to a model.
7. Treat suspicious content as a possible attack without relying solely on a model's ability to detect it.

Prompt wording alone is not an adequate security boundary. Enforcement belongs in application code.

8.3 Provider routing and fallback

When multiple models or providers are configured:

- Apply the same permission policy to every provider.
- Do not silently route private data to an unapproved provider.
- Keep provider-specific credentials isolated.
- Respect configured data-sharing preferences.
- Do not retry sensitive requests against an alternative provider without authorization.
- Use bounded retries, timeouts and rate-limit handling.
- Avoid duplicate execution of non-idempotent actions after a timeout.

Provider fallback must not silently change privacy settings, retention settings or user authorization.

8.4 Model output and code execution

Generated code is untrusted until reviewed and tested.

- Do not automatically execute generated code with unrestricted permissions.
- Use an isolated, least-privilege execution environment for supported code-running features.
- Apply CPU, memory, disk and time limits where execution is enabled.
- Restrict filesystem and network access according to the task.
- Do not assume a Python virtual environment is a security sandbox.
- Never run generated scripts as Administrator by default.
- Make file modifications reviewable and recoverable.

If a secure execution boundary is not available, the feature must remain non-executing or require a documented, appropriately limited manual workflow.

---

9. Computer Control and Sensitive Actions

Computer-control tools can have consequences outside the application. Every such operation must pass through the authorization layer.

9.1 Permission categories

Use distinct capabilities rather than a single unrestricted "computer_control" permission.

Examples:

- "screen.read"
- "camera.capture"
- "microphone.capture"
- "filesystem.read"
- "filesystem.write"
- "browser.navigate"
- "keyboard.input"
- "mouse.control"
- "process.inspect"
- "process.launch"
- "shell.execute"
- "message.send"
- "purchase.submit"
- "settings.modify"

These identifiers are examples. The implemented registry must define the actual supported permissions and their scope.

9.2 Confirmation requirements

Require explicit, action-specific user confirmation for consequential or externally visible operations, including:

- Sending messages or emails.
- Publishing or uploading content.
- Making purchases or financial commitments.
- Deleting files or data.
- Overwriting important documents.
- Executing commands with significant side effects.
- Changing security settings or access permissions.
- Sharing private data with an external service.

The confirmation must describe the actual action, destination, relevant data and significant consequences.

A vague confirmation such as “continue?” is insufficient for a high-impact operation.

Do not reuse an approval for a materially different action, destination, scope or set of parameters. Expire approvals after the defined operation or session.

9.3 Destructive actions

Before a destructive operation:

1. Validate the target.
2. Confirm the requested scope.
3. Check that the user is authorized.
4. Preview the affected items when feasible.
5. Create a backup or recovery point when appropriate.
6. Require explicit confirmation.
7. Record the outcome.

If the target cannot be verified, abort rather than guessing.

9.4 Emergency stop

Provide a reliable way to stop active automation.

The stop mechanism must:

- Stop scheduling new actions.
- Cancel cancellable tasks.
- Attempt to interrupt running operations safely.
- Prevent queued tasks from continuing without reauthorization.
- Record which tasks stopped and which could not be interrupted.
- Remain accessible while the assistant is running.

Do not claim that an operation has been stopped until the application verifies its state. Some operating-system operations may not be cancellable once committed.

---

10. Camera, Microphone, Screenshots and Privacy

- Request access only when the user invokes a feature that requires it.
- Clearly indicate active capture where technically possible.
- Provide an accessible way to stop capture.
- Do not activate the camera or microphone covertly.
- Do not store recordings or screenshots by default unless required by an explicitly enabled feature.
- Disclose retention behavior before enabling persistent recording.
- Do not upload captured data to external providers without the applicable authorization.
- Minimize image resolution, audio duration and captured screen area to what the task needs.
- Avoid capturing passwords, authentication codes and unrelated sensitive windows where feasible.
- Apply access controls and retention limits to any stored media.
- Do not describe software indicators as a substitute for operating-system permissions.

If capture permissions are unavailable, the feature must fail safely and explain what is missing.

---

11. Memory, Database and Filesystem Security

11.1 Persistent memory

- Validate memory records before saving.
- Keep memory access scoped to the active feature and task.
- Do not store secrets or authentication codes as ordinary conversational memories.
- Clearly distinguish user-approved persistent facts from temporary task context.
- Provide a supported way to inspect, correct and delete application-managed memories.
- Respect deletion requests across the application's own indexes and derived records where applicable.
- Do not treat a memory record as authorization to perform a privileged action.

11.2 SQLite

- Use parameterized SQL or ORM operations.
- Do not concatenate untrusted input into SQL statements.
- Apply schema migrations through the established migration system.
- Use transactions for related state changes.
- Handle database locks and interrupted writes without corrupting data.
- Restrict access to database, journal, WAL and backup files.
- Do not expose raw database errors or contents through public-facing responses.
- Test migrations against representative existing databases.

11.3 Filesystem access

- Canonicalize and validate paths before performing protected operations.
- Enforce approved directory scopes.
- Prevent path traversal, including ".." sequences and unexpected absolute paths.
- Account for symlinks and Windows path variations.
- Do not rely on file extensions alone to determine whether a file is safe.
- Avoid overwriting a file if its identity or location changed after validation.
- Use temporary files and atomic replacement where practical.
- Do not automatically read the entire home directory, browser profile or credential directories.

Path checks must be performed as close as possible to the actual filesystem operation to reduce time-of-check/time-of-use risks.

11.4 Backup and deletion

- Backups containing sensitive data must receive protection comparable to the source data.
- Test restoration, not merely backup creation.
- Warn before irreversible data deletion.
- Do not automatically upload backups to cloud storage.
- Document which data remains after uninstall.
- Never silently delete user data during an application upgrade.

---

12. Web Access and External Content

If JARVIS retrieves webpages or accesses URLs:

- Allow only supported URL schemes, normally HTTP and HTTPS.
- Reject unexpected schemes such as "file:", "javascript:" and unsupported local-resource protocols.
- Validate redirects and every destination in a redirect chain.
- Protect against server-side request forgery (SSRF), including access to loopback, private networks, link-local addresses and cloud metadata endpoints where relevant.
- Revalidate resolved addresses and redirect destinations to reduce DNS-rebinding risks.
- Apply connection, response-size and time limits.
- Do not automatically download or execute retrieved files.
- Treat retrieved content as untrusted input.
- Avoid transmitting private memory, local file contents or credentials to a website unless the user has authorized the specific operation.

If local-network access is a supported feature, it must use an explicit, narrowly scoped policy rather than disabling SSRF protections globally.

---

13. Skills and Extension Security

"SKILLS.md" defines the skill lifecycle and permission model. The following cross-cutting controls are mandatory.

- Each skill must have an explicit identity and declared capability requirements.
- A skill must receive only the permissions granted to it.
- AI-generated descriptions cannot grant executable capabilities.
- Unknown or unreviewed skills must not execute automatically.
- Skills must not load arbitrary code or files from untrusted paths.
- Dependencies and external service requirements must be documented.
- Errors must not cause a skill to bypass the normal execution policy.
- Skill updates must be validated before activation.
- A skill must not disable logging, authentication or policy checks.
- Security-relevant skill actions must be auditable.
- Removal or disabling of a skill must prevent future scheduling and execution.

If a skill is compromised, revoke its permissions and disable it without requiring the entire application to grant it additional access.

---

14. Background Tasks and Agent Recovery

Background jobs and recovery agents can multiply the impact of a defect.

- Give each task an explicit owner, purpose, permission scope and lifecycle.
- Apply task deadlines, retry limits and concurrency limits.
- Use bounded exponential backoff with jitter where appropriate.
- Prevent retry loops from continuing indefinitely.
- Do not automatically repeat non-idempotent actions unless their execution status has been verified.
- Preserve authorization boundaries during retries and recovery.
- Do not let a recovery agent modify its own security policy to make a failing operation succeed.
- Quarantine repeated failures and require review for consequential recovery actions.
- Record the distinction between attempted, completed, failed and unverified actions.

A background task must not continue to perform sensitive operations after its authorization expires or the user has disabled the relevant capability.

---

15. Logging, Auditing and Diagnostics

15.1 Log requirements

Security-relevant events should include:

- Timestamp and severity.
- Event category.
- Task or correlation identifier.
- Relevant component or skill identifier.
- Authorization decision.
- Outcome and sanitized error category.

Where appropriate, record who initiated the action and whether user confirmation was obtained.

15.2 Never log

- Raw API keys or access tokens.
- Passwords, encryption keys or recovery secrets.
- Authentication headers or session tokens.
- Full private documents without an explicit, justified diagnostic need.
- Unredacted sensitive conversations by default.
- Full camera, microphone or screenshot data.
- Sensitive request bodies merely to simplify debugging.

Redaction must happen before data reaches the log sink. Filtering only the displayed logs is insufficient.

15.3 Log protection

- Restrict local log access.
- Apply rotation and retention limits.
- Avoid unlimited log growth.
- Treat imported log files as untrusted data.
- Prevent newline injection and forged audit entries.
- Do not allow ordinary skills to erase or rewrite protected security audit records.
- Ensure diagnostic exports are reviewed and sanitized before sharing.

Logs must remain useful for debugging without becoming a second database of sensitive user information.

---

16. Dependency and Software Supply-Chain Security

- Use maintained and reputable dependency sources.
- Commit the relevant lockfiles.
- Pin or constrain dependencies according to the project's reproducibility strategy.
- Review dependency updates before accepting them.
- Run suitable vulnerability and malware checks where available.
- Review transitive dependencies for high-risk components.
- Avoid downloading executable dependencies dynamically during ordinary application startup.
- Do not disable TLS certificate verification to fix network errors.
- Keep build tools and packaging dependencies documented.
- Verify release artifacts and their provenance where practical.
- Investigate critical security advisories promptly.

A vulnerability scanner reporting no findings does not prove that a dependency is safe.

If a critical dependency vulnerability is found, assess exploitability and impact, then update, mitigate or disable the affected feature as appropriate.

---

17. Network and Transport Security

- Use HTTPS with certificate verification for remote provider communications.
- Do not suppress TLS errors as a routine workaround.
- Set timeouts for outbound connections.
- Limit response sizes and retry counts.
- Avoid sending credentials to unexpected hosts.
- Validate provider endpoints against configured, supported destinations where practical.
- Keep local services bound to the narrowest required interface.
- Do not assume encrypted transport makes a provider trustworthy.
- Do not assume a provider's retention or training practices without verifying its current terms and configuration.

Provider data handling must be disclosed in the application's settings or privacy documentation.

---

18. Updates and Installer Security

The packaged Windows application must follow these requirements:

- Package only required runtime components and resources.
- Avoid shipping ".env" files, test credentials, private keys, local databases or developer-specific paths.
- Verify installer contents before release.
- Use code signing when available and appropriately configured.
- Never ship signing private keys with the application.
- Verify update sources and signatures if an automatic update mechanism is implemented.
- Do not execute downloaded updates without the applicable integrity and authenticity checks.
- Test upgrades against existing user data.
- Preserve user data by default during normal upgrades.
- Make uninstall and data-removal behavior explicit.
- Test installation and startup under a standard, non-administrator Windows account.

If secure update verification is not implemented, do not advertise the update process as cryptographically verified.

---

19. Error Handling and Fail-Safe Behavior

When a security-sensitive operation fails:

- Deny the operation if authorization cannot be established.
- Do not disable validation to keep the feature running.
- Do not fall back to unrestricted execution.
- Do not expose stack traces, secrets or sensitive paths to ordinary users.
- Preserve enough sanitized diagnostic context for troubleshooting.
- Release temporary resources and close open handles.
- Mark uncertain outcomes as unknown rather than successful.
- Require verification before retrying operations with external side effects.

Graceful degradation is acceptable only when it preserves the security boundary.

For example, if the AI provider is unavailable, JARVIS may offer offline features. It must not bypass access controls merely to keep the assistant responsive.

---

20. Security Testing Requirements

Security tests must be executable, repeatable and included in the project's test workflow.

At minimum, cover the following areas as their associated features are implemented.

Authentication and authorization

- Requests without valid local authentication are rejected.
- Invalid, expired or revoked permissions are rejected.
- Unregistered tools cannot execute.
- Skills cannot grant themselves new permissions.
- Provider fallback cannot expand the permission scope.

Input and filesystem handling

- Malformed schemas and oversized inputs are rejected.
- Path traversal attempts fail.
- Unauthorized directories remain inaccessible through application tools.
- Symlink and path-normalization cases are tested.
- SQL injection attempts do not alter query structure.

AI and external content

- Prompt-injection content cannot grant permissions.
- Malformed model output does not trigger arbitrary execution.
- Retrieved content cannot bypass confirmation requirements.
- Provider errors do not disable validation.
- Sensitive data is not transmitted to unapproved providers.

Secrets and logs

- Placeholder configuration contains no real credentials.
- Secrets are not present in frontend bundles.
- Representative exceptions do not leak tokens.
- Diagnostic exports redact known secret patterns.
- Git secret scanning is configured and its findings are reviewed.

Computer control and privacy

- Unapproved sensitive actions are blocked.
- High-impact operations require the configured confirmation.
- Cancelled tasks do not continue scheduling further actions.
- Camera and microphone failures do not result in hidden retries.
- Background jobs respect revoked permissions.

Packaging and recovery

- The packaged app starts without development tools installed, where the deployment design requires it.
- The installer contains no development secrets.
- Database migrations and backup restoration are tested.
- Upgrade and uninstall behavior match documented data-retention rules.
- The application operates without unnecessary administrator privileges.

Tests must use synthetic data and fake credentials wherever practical. Never run destructive security tests against a real user database or production credential.

A passing test suite reduces risk but does not prove the absence of vulnerabilities.

---

21. Vulnerability Severity and Response

Use a documented triage process that considers both technical severity and actual exploitability.

Severity| Example| Required response
Critical| Unauthenticated remote code execution or confirmed credential compromise| Stop affected release or feature; contain and remediate urgently
High| Permission bypass, unauthorized sensitive file access or serious secret leakage| Prioritize immediate mitigation and a security fix
Medium| Limited data exposure or exploitable weakness requiring additional conditions| Schedule a risk-based fix and add regression tests
Low| Minor hardening gap with limited impact| Record, assess and address according to release risk

Severity classifications must reflect the actual threat model, affected users and available attack path. Do not lower severity merely because exploitation is inconvenient.

21.1 Reporting process

When a vulnerability is identified:

1. Record the affected component and version.
2. Document reproducible steps without unnecessarily exposing private data.
3. Assess confidentiality, integrity and availability impact.
4. Identify affected releases and dependencies.
5. Apply containment or disable the affected feature if necessary.
6. Implement and test the fix.
7. Add regression coverage.
8. Verify the packaged build when the issue affects release behavior.
9. Document the resolution and any required credential rotation.

Do not publish exploitable details or secrets before a practical mitigation is available.

---

22. Privacy and Data Lifecycle

The application must document what data is processed locally and what data is transmitted externally.

- Collect only the data needed for the requested task.
- Make remote-provider usage clear.
- Explain the retention behavior of persistent memory and logs.
- Provide supported deletion and export mechanisms where applicable.
- Avoid collecting analytics by default unless the feature and its data handling are explicitly documented.
- Do not silently upload diagnostic reports.
- Do not treat deletion from the visible interface as proof that every backup or external provider copy has been deleted.
- Explain relevant limitations when third-party services control retention.

The privacy notice and actual application behavior must agree. Do not claim that all data remains local when a configured remote model or service receives user content.

---

23. Secure Development Checklist

Before merging a security-relevant change, verify the applicable items.

- [ ] Inputs are validated at the trusted execution boundary.
- [ ] Authorization is enforced outside the AI model.
- [ ] Permissions follow least privilege.
- [ ] Secrets are not hardcoded or logged.
- [ ] Sensitive actions require the appropriate approval.
- [ ] File and network access use explicit scopes.
- [ ] Errors fail safely.
- [ ] Tests cover expected and adversarial inputs.
- [ ] Existing security controls remain enabled.
- [ ] Dependencies and lockfiles are updated appropriately.
- [ ] Documentation matches actual behavior.
- [ ] Security-relevant audit events are recorded without private payload leakage.

Not every item applies to every change. Mark non-applicable items as such during review rather than claiming that unperformed checks passed.

---

24. Release Security Gate

A release must not be labelled security-verified unless the relevant checks have actually been executed and reviewed.

Before release:

1. Run the project's required automated tests.
2. Run the configured lint, type and dependency checks.
3. Review outstanding high- and critical-severity findings.
4. Confirm that no secrets or local user data are included in the artifact.
5. Validate production configuration and Tauri capability scopes.
6. Test relevant authorization and sensitive-action flows.
7. Verify installer and upgrade behavior on a clean or appropriately isolated Windows environment.
8. Review the release logs for accidental credential disclosure.
9. Record test results, known limitations and unresolved risks.

If any required check cannot be run, report it as not verified. Do not silently treat it as passed.

---

25. Implementation Rules for AI Coding Agents

Any AI coding agent working on JARVIS must obey these rules.

1. Read the existing project documentation before changing security-sensitive code.
2. Inspect the current implementation before creating a new security subsystem.
3. Reuse existing validated authorization, logging and configuration components when appropriate.
4. Do not duplicate configuration sources or create conflicting permission registries.
5. Do not weaken a security control to make a test pass.
6. Do not add an unrestricted shell, filesystem or network tool for convenience.
7. Do not claim a test, scan, build or installer succeeded unless it actually ran and its result was checked.
8. Do not modify Git history destructively or expose repository secrets.
9. Explain any proposed relaxation of this policy and request explicit review before implementing it.
10. Report incomplete security features honestly.

When an implementation conflicts with this policy, pause the affected change, describe the conflict and propose a secure alternative.

---

26. Security Limitations and Honest Claims

JARVIS must not claim:

- That prompt injection can be eliminated completely.
- That encryption prevents access by every local attacker.
- That a local API is safe solely because it binds to loopback.
- That AI-generated code is safe because a model approved it.
- That a clean dependency scan proves the absence of vulnerabilities.
- That deleting a credential from the latest commit removes it from history.
- That a stopped task has been cancelled if its status is unknown.
- That data is fully deleted from a third-party provider without evidence.
- That the application has zero bugs or zero security risks.

Security claims must match implemented controls and verifiable evidence.

---

27. Definition of Security Readiness

JARVIS is ready for a defined release only when:

- The applicable security controls are implemented.
- Authorization and permission boundaries have tests.
- Sensitive data handling is documented and tested.
- No unresolved release-blocking vulnerability is accepted without an explicit, documented risk decision.
- Build and installer checks have been completed where applicable.
- Known limitations are recorded.
- Required checks that were not run are clearly identified.
- The release status is based on evidence rather than assumptions.

Final rule: A feature that has not been securely implemented and tested must remain disabled, restricted or clearly labelled experimental. Functional completeness never overrides the security policy.