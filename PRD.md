# JARVIS — MASTER PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Autonomous Personal AI Assistant for Windows and Android

**Document version:** 1.0.0  
**Project name:** JARVIS  
**Document status:** Master specification for implementation  
**Primary targets:** Windows desktop and Android mobile  
**UI technologies:** HTML5, CSS3, TypeScript, React  
**Desktop runtime:** Tauri 2 with Rust  
**Backend:** Python, FastAPI, Pydantic  
**Android application:** Kotlin, Jetpack Compose  
**Local persistence:** SQLite  
**Repository:** Git and GitHub  
**Project owner:** Administrator (the user)  
**Primary implementation agents:** Antigravity or Claude Code

---

# PART 1 — MANDATORY INSTRUCTIONS FOR THE CODING AGENT

## 1.1 Your role

You are the principal software architect, senior full-stack developer, Android developer, UI engineer, QA engineer, security reviewer, documentation maintainer, and release engineer for JARVIS.

You are responsible for implementing the actual application, not merely generating a visual prototype or an architecture proposal.

You must:
- Inspect the existing repository before changing files.
- Understand the complete PRD before implementation.
- Create and maintain the required project documentation.
- Create an implementation plan before writing application features.
- Implement one phase at a time.
- Run relevant tests after each implementation phase.
- Fix failures before marking the phase complete.
- Preserve all project data, user changes, and historical records.
- Maintain Git history and publish source/documentation to the configured GitHub repository.
- Report honestly what is implemented, tested, partially supported, blocked, or not implemented.
- Avoid claiming a feature works unless its real integration has been verified.

**Do not start by generating the entire application in one massive code-writing operation.** Plan the repository, establish the architecture, create the project memory and documentation, and then implement and verify incremental phases.

Do not stop after creating a plan. Once the initial planning requirements are satisfied, start implementing the first phase and continue in order, unless a genuine security issue, missing mandatory credential, unavailable device, or destructive action requires administrator input.

## 1.2 Zero-fabrication rule

Never create a fake implementation to make a checklist appear complete.

The following are prohibited as production behavior:
- Buttons that do nothing.
- Fake progress bars.
- Hard-coded results presented as real model output.
- Random hologram movement presented as microphone activity.
- Fake success messages.
- Fake provider connection status.
- Simulated files presented as processed files.
- Placeholder data presented as real screen or device information.
- Error messages that conceal the actual failed operation.
- Empty functions marked as completed.
- `TODO` comments used to conceal required functionality.
- Mock backends exposed as real production services.

Mocks are allowed in isolated unit tests and controlled development fixtures, but they must be visibly separate from real application behavior and must never be reported as proof of a real integration.

If an integration cannot be completed, mark it explicitly as `BLOCKED`, `UNSUPPORTED`, or `NOT IMPLEMENTED`, explain why, and create a tracked task to resolve it.

## 1.3 Planning-before-coding protocol

Perform these steps in order.

### Step 1: Inspect the project

Check:
- Existing directory structure.
- Git status and current branch.
- Existing files and uncommitted changes.
- Existing framework versions and dependencies.
- Existing tests and CI workflows.
- Existing documentation.
- Existing environment configuration.
- Available build tools and target platforms.
- Configured GitHub remote and authentication state, if available.

Do not delete or overwrite existing project content merely to match the proposed structure. Adapt the plan to preserve valid existing work.

### Step 2: Analyze the complete requirements

Split every requirement into:
- Feature ID.
- User story.
- Frontend work.
- Backend work.
- Database changes.
- Platform-specific integration.
- Permissions and security implications.
- Dependencies.
- Failure cases.
- Automated test.
- Real-environment acceptance test.
- Completion evidence.

Identify conflicts, unsupported platform operations, dependencies, and uncertain integrations before designing their implementation.

### Step 3: Produce the implementation plan

Create:
- `implement_plan.md`
- `workflow.md`
- `data.md`
- `test.md`
- `task.md`
- `memory.md`
- `AGENTS.md`
- `README.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
- `PRIVACY.md`
- `CHANGELOG.md`

Also create the initial directory structure, project configuration, dependency manifests, environment templates, and CI workflow appropriate to the inspected repository.

### Step 4: Validate the plan

Verify that:
- Every PRD feature has an ID and implementation task.
- Every page has its corresponding UI and backend requirements.
- Platform-specific restrictions are documented.
- Every database entity has a migration and retention policy.
- Every external integration has permission and error handling.
- Testing and release gates are defined.
- The recovery mechanism is not dependent on a single file.
- All documentation refers to the same architecture and implementation phases.

Record unresolved items as explicit decisions or blockers. Do not invent external credentials, hardware capabilities, API availability, or test results.

### Step 5: Begin implementation

After the initial plan and project documentation are coherent, start Phase 1.

For each phase:
1. Read `memory.md`, `implement_plan.md`, `workflow.md`, `data.md`, `test.md`, and `task.md`.
2. Check Git status and current project health.
3. Confirm the phase's acceptance criteria.
4. Implement a small, logically complete unit of work.
5. Run tests and type/static checks.
6. Fix failures and run regression tests.
7. Update documentation and memory.
8. Record actual evidence and unresolved issues.
9. Commit verified changes.
10. Continue to the next task when its dependencies are satisfied.

Do not repeatedly rewrite the full plan when a small issue can be handled through a documented decision. Do not mark work complete merely because source code has been generated.

## 1.4 Administrator command protocol

Implement these commands in the agent's supported command interface or project workflow. If a command cannot be exposed as a slash command in the selected coding environment, provide an equivalent script or documented procedure.

| Command | Required behavior |
|---|---|
| `/plan` | Analyze remaining requirements and update the implementation plan. |
| `/status` | Show phase, completed tasks, active task, blockers, test results, and next actions. |
| `/task` | Create, inspect, update, or complete a tracked task. |
| `/memory` | Rebuild/update `memory.md` from canonical project state, Git history, task records, and verified documentation. Create a recovery snapshot as configured. |
| `/workflow` | Explain or inspect the project workflow and current execution steps. |
| `/test` | Run the relevant test suite and report real results. |
| `/audit` | Inspect security, dependency risks, permission scopes, secrets exposure, and project consistency. |
| `/backup` | Create a verified backup according to the backup configuration. |
| `/restore` | List available recovery points and restore only after validating the target and obtaining confirmation for destructive changes. |
| `/resume` | Recover the project context and resume the highest-priority incomplete task without duplicating completed work. |
| `/release-check` | Validate the release gates and produce a release-readiness report. |

The implementation must document which of these commands are available inside JARVIS and which are provided through the coding-agent environment or repository scripts.

## 1.5 Git and GitHub requirements

Treat the repository as the authoritative source history for the project.

- Use a Git branch for each meaningful feature or phase.
- Commit coherent, verified changes.
- Use descriptive commit messages.
- Keep documentation and tests in the same repository as the code.
- Push to the configured GitHub remote when authorized and authenticated.
- Do not claim a push succeeded unless the remote operation actually succeeds.
- If GitHub authentication or connectivity is unavailable, commit locally where possible and report that the remote push remains pending.
- Never commit API keys, passwords, access tokens, private certificates, private user documents, or unencrypted recovery secrets.
- Use `.gitignore` for build artifacts, caches, local databases, virtual environments, secrets, and generated large files.
- Do not accidentally commit `node_modules`, Python environments, private runtime logs, or downloaded model weights.
- Store public documentation and source code in Git; store private runtime data in encrypted or access-controlled backup storage.
- Do not force-push, rewrite shared history, delete branches, reset user changes, or overwrite existing data without explicit authorization.

GitHub is not a substitute for runtime backup. Local user memory, databases, logs, and credentials must have a separate backup and restoration strategy.

---

# PART 2 — PRODUCT VISION AND SCOPE

## 2.1 Product vision

JARVIS is a personal AI assistant that combines conversation, persistent memory, AI model routing, file intelligence, computer interaction, workflow automation, device handoff, research, project orchestration, and controlled self-development in a single application ecosystem.

The application should feel like a coherent assistant rather than a collection of disconnected tools.

## 2.2 Primary platforms

### Windows desktop

The Windows application is the primary desktop implementation.

It must provide:
- A complete desktop UI.
- Voice interaction.
- The central command system.
- Model and provider management.
- Persistent memory.
- Task orchestration.
- File intelligence.
- Browser and desktop automation.
- Project tools.
- Security controls and detailed diagnostics.
- A packaged Windows installer.

### Android mobile

The Android application must provide:
- A touch-first native UI.
- Voice conversation.
- Shared memory and project/task synchronization.
- Supported app launch and device controls.
- Permission-aware accessibility interactions.
- Notifications and supported background operations.
- Camera and microphone features when authorized.
- A recoverable synchronization state.
- An installable APK.

### Shared brain

Windows and Android must share a consistent logical identity, user preferences, projects, and eligible tasks.

They do not need to run identical low-level code. Windows and Android require separate platform adapters because their operating systems and permissions differ.

### Optional remote worker

Remote workers may execute eligible, explicitly configured jobs when the local desktop is offline.

Remote execution requires actual deployed infrastructure, authentication, and network access. It must not be represented as automatically available or free.

## 2.3 Non-goals and explicit limitations

JARVIS must not promise:
- Unlimited computing power.
- Unlimited free access to AI models.
- Automatic control of every secure app or website.
- Unrestricted control of Android system settings.
- Silent payment authorization.
- Automatic bypass of authentication, biometrics, OTPs, anti-fraud checks, or access controls.
- Recovery from every conceivable form of total data loss without an independent backup.
- Automatic continuation of a local task when the device hosting that task is powered off.
- Full model training simply because documents have been imported.

The application should make every practical supported capability useful and reliable, and accurately disclose limitations.

---

# PART 3 — TECHNOLOGY ARCHITECTURE

## 3.1 Desktop frontend

Use:
- HTML5.
- CSS3.
- TypeScript.
- React.
- A maintained React routing solution.
- A consistent component and design-token system.
- An accessible icon library.
- Tauri 2 for the Windows desktop container.
- Rust for minimal, permission-scoped native integration.

Use reusable components for navigation, forms, buttons, status indicators, logs, modals, task cards, model selection, and permissions.

Do not implement every screen as a single giant component.

Use strict TypeScript settings. Avoid untyped or unrestricted `any` values unless a documented third-party boundary requires a narrow exception.

## 3.2 Backend

Use:
- Python.
- FastAPI.
- Pydantic models.
- Typed service interfaces.
- Structured logging.
- A database migration system.
- A background task queue appropriate to the selected deployment.
- A separate adapter layer for operating-system actions and external providers.

Backend services must not depend directly on React components.

All external requests must have timeouts, error handling, and appropriate retry policies.

## 3.3 Android

Use:
- Kotlin.
- Jetpack Compose.
- Android-native navigation and lifecycle management.
- Room or a well-defined SQLite persistence layer.
- Android's supported app intents and permission mechanisms.
- Accessibility Service only for transparently disclosed and authorized interaction use cases.
- Secure storage for locally retained sensitive credentials when applicable.

Do not port the full Python desktop backend into Android without an explicit architecture reason.

Do not attempt to evade Android restrictions through hidden accessibility operations, unapproved background activity, or deceptive permission requests.

## 3.4 Persistence and retrieval

Start with SQLite for local state.

Use migrations for all schema changes.

Select a vector search implementation only after validating:
- Supported platforms.
- Storage format.
- Maintenance.
- Performance.
- Backup and restore compatibility.

Do not introduce a large or distributed database without a real requirement.

## 3.5 Local and remote execution

Support a clear execution model:

**Local execution:** the task runs on the current device and stops or pauses safely if that device becomes unavailable.

**Remote execution:** the task runs on an authenticated worker with its own durable queue, persistence, resource limits, and logs.

**Cross-device handoff:** the second device receives shared task state and may claim or continue a task only when its required tools and permissions are available.

Implement task leases or equivalent coordination so the same task is not executed concurrently by multiple workers without explicit support.

---

# PART 4 — APPLICATION DESIGN SYSTEM

## 4.1 Visual identity

The design should be futuristic, premium, restrained, and readable.

Primary styling:
- Near-black and charcoal backgrounds.
- Gold and amber accents.
- Controlled glow and subtle gradients.
- A central holographic orb/face.
- Fine rings, restrained particles, and soft waveform effects.
- Clear text contrast.
- Smooth but efficient transitions.
- Consistent status indicators.

Avoid making the interface visually busy or difficult to read.

## 4.2 Desktop layout

Use a top navigation system rather than a permanent left sidebar.

The desktop layout includes:
- Top header and JARVIS identity.
- Main navigation.
- Central page content.
- Hologram or current-task view where appropriate.
- Optional contextual right-hand panel.
- Persistent global command entry.
- Global status and error access.
- Task notification indicators.

Support resizing, keyboard navigation, appropriate focus behavior, and high-DPI Windows displays.

## 4.3 Mobile layout

Use a compact header and bottom navigation.

Mobile requirements:
- No unnecessary simulated mouse cursor.
- Touch-first layouts.
- Adequate touch target sizes.
- Support for portrait screens.
- Correct keyboard and text-field behavior.
- Safe handling of keyboard insets and system bars.
- Proper use of Android back navigation.
- Clear foreground microphone/activity indicators.
- Reduced-motion and battery-conscious animation options.

## 4.4 Hologram behavior

The hologram must reflect real application state.

Required states:
- Idle.
- Listening.
- Transcribing.
- Thinking.
- Running an action.
- Speaking.
- Waiting for user input.
- Permission blocked.
- Error.
- Offline.
- Paused.

If the microphone is not active, the hologram must not imply that speech is being captured.

If the model is not working, it must not continue displaying a false “thinking” state.

Support configurable avatar styles. Lip-sync quality depends on the selected voice and animation implementation.

## 4.5 Accessibility and UI quality

Every screen must support:
- Clear focus states.
- Keyboard navigation where appropriate.
- Readable text sizing.
- Accessible labels.
- Error messages tied to the relevant controls.
- Responsive layout.
- Consistent loading and empty states.
- Respect for operating-system accessibility and reduced-motion preferences.

---

# PART 5 — PAGE-BY-PAGE FUNCTIONAL SPECIFICATION

All pages listed below are production features, not decorative mockups.

Every page must have real state, proper navigation, validation, errors, permission checks where required, and tests.

## PAGE 1 — Home Dashboard

**Purpose:** Show JARVIS's real current state.

### Components
- JARVIS hologram.
- Voice status.
- Active device.
- Active task summary.
- Recent tasks.
- Provider health summary.
- Memory/database status.
- Permission alerts.
- Backup health.
- Quick command input.
- Quick actions.
- Recent errors.
- Current project summary.

### Actions
- Start voice session.
- Enter a command.
- Open the Task Centre.
- Resume a supported paused task.
- Open recent projects.
- Open diagnostics.
- Pause automation.
- Open settings.

### Real data requirements
All statuses must come from actual backend health checks or stored application state.

### Acceptance criteria
- A backend failure is visible.
- Stale provider status is marked with its last-checked time.
- Empty installations show a useful onboarding path.
- Buttons execute their documented action.
- Restarting the app restores eligible persisted state without claiming that unfinished local actions succeeded.

## PAGE 2 — Universal Command Centre

**Purpose:** The single interface for text and voice commands.

### Inputs
- Typed natural-language commands.
- Voice transcription.
- Optional file attachments.
- Optional selected device or project context.

### Processing flow
1. Receive the command.
2. Authenticate the local/user session as required.
3. Identify the intent.
4. Resolve ambiguous targets using available application state.
5. Generate a structured action plan.
6. Check permissions, policy and risk.
7. Ask for approval when required.
8. Execute through the proper adapter.
9. Verify the actual result where possible.
10. Store task status, evidence and an audit record.
11. Report success, partial success, or failure.

### Required behavior
A request such as “Open my browser and search for a topic” should create a traceable task and report what actually happened.

A request that cannot be reliably interpreted must not trigger an unpredictable action.

### Task states
- Draft.
- Awaiting approval.
- Queued.
- Running.
- Paused.
- Completed.
- Partially completed.
- Failed.
- Cancelled.
- Blocked.

### Acceptance criteria
- Tasks are persisted.
- Long-running tasks can be inspected.
- Cancellation reaches the underlying worker.
- The UI does not display success before completion is confirmed.
- Sensitive actions invoke the required approval flow.

## PAGE 3 — Voice and Conversation Studio

**Purpose:** Configure and operate voice-based interaction.

### Features
- Wake phrase configuration.
- Push-to-talk fallback.
- Speech-to-text.
- Text-to-speech.
- Voice selection.
- Voice speed and volume.
- Language preference.
- Hindi, English, and Hinglish support where providers permit.
- Conversation history.
- Interruption and cancellation.
- Microphone selection on supported desktop hardware.
- Input/output device diagnostics.
- Wake-word sensitivity where configurable.

### Functional requirements
- Use an authorized audio device.
- Show when the microphone is listening.
- Show transcription failures.
- Recover from disconnected microphones.
- Avoid duplicate speech playback.
- Support text-only use when audio is unavailable.
- Do not claim to use a particular actor's voice unless appropriately licensed. Prefer an original assistant voice.

### Acceptance criteria
Test recognition, transcription, speech playback, interruption, microphone denial, unavailable audio devices, and voice-service outages.

## PAGE 4 — Contextual Memory

**Purpose:** Maintain useful, inspectable long-term personal and project context.

### Memory categories
- User preferences.
- Language/style preferences.
- Project requirements.
- Architecture decisions.
- Task summaries.
- Completed milestones.
- Known bugs.
- Repeated workflow preferences.
- Approved reminders/contextual facts.

### Features
- Browse memories.
- Search memories.
- Open a memory record.
- Edit incorrect memories.
- Delete selected memories.
- Export and import eligible memory data.
- Inspect source and last-updated time.
- Mark facts as unverified or stale.
- Distinguish explicit user statements from inferred information.

### Rules
- Do not treat model-generated guesses as verified facts.
- Sensitive information must have appropriate handling and retention controls.
- Do not store passwords, API keys, OTPs, private certificates, or recovery secrets in readable Markdown files.
- A deleted memory should not silently reappear from an old backup unless the administrator explicitly restores that backup.
- Preserve the user's ability to review what is remembered.

### Acceptance criteria
Memory survives a normal app restart, is searchable, respects deletion settings, and restores from a verified backup.

## PAGE 5 — Project Memory and Knowledge Graph

**Purpose:** Connect information about projects, tasks, files, decisions, and dependencies.

### Features
- Project entities.
- Task entities.
- Document references.
- Decision records.
- Relationship visualization.
- Dependency inspection.
- Search by project/topic.
- Source-linked relationships.
- Stale-record detection.

### Rules
Connections must be based on stored or verified data. The graph must not invent relationships merely to appear populated.

## PAGE 6 — Knowledge Vault

**Purpose:** Import documents and make their contents searchable.

### Supported formats
Implement file handlers according to actual maintained libraries and platform capabilities for formats including:
- PDF.
- DOCX.
- TXT.
- Markdown.
- CSV.
- XLSX.
- JSON.
- Source code.
- Common image formats.
- Common audio formats.
- Common video formats.
- Archives, when safe and supported.

Additional formats may be added through registered handlers.

### Processing pipeline
1. Validate file type and size.
2. Inspect metadata.
3. Scan archives and reject unsafe traversal paths.
4. Extract content.
5. Run OCR or transcription when required.
6. Normalize text.
7. Chunk long documents.
8. Store references and metadata.
9. Build the search index.
10. Verify indexing completed.
11. Store extraction warnings and errors.

### Features
- Upload/import.
- Batch processing.
- Search.
- Preview.
- Source references.
- Processing queue.
- Retry failed documents.
- Reindex.
- Remove indexed records.
- Export metadata.
- View extracted text.

### Security
Imported documents and archives must be treated as untrusted input. Do not automatically execute embedded scripts, binaries, or commands.

### Acceptance criteria
The application shows which files were processed successfully, partially processed, skipped, or failed. Results must not imply that an unreadable document was fully indexed.

## PAGE 7 — Multi-Agent Workbench

**Purpose:** Orchestrate specialized agents for complex work.

### Agent roles
- Planner.
- Researcher.
- Developer.
- Code reviewer.
- Tester.
- Documentation specialist.
- File analyst.
- Automation worker.
- Release reviewer.

These are logical roles. They may use the same underlying model with different instructions, different models, or separate workers.

### Features
- Create a task.
- Assign eligible subtasks.
- Define dependencies.
- Set an execution budget.
- View agent activity.
- View inputs and outputs.
- Inspect tool calls and errors.
- Retry eligible failures.
- Cancel work.
- Pause/resume.
- Require approval for privileged actions.
- Record artifacts and verification evidence.

### Rules
- Agents must not fabricate tool results.
- Untrusted web/document content must not override system or administrator instructions.
- Different agents must not silently overwrite each other's work.
- Use branch, workspace, or artifact isolation for conflicting file changes.
- Final reports must distinguish proposed, implemented, and tested changes.

### Acceptance criteria
Execute a real multi-step task, record dependencies and results, recover from an agent failure, and prevent unapproved privileged actions.

## PAGE 8 — Long-Running Project Mode

**Purpose:** Manage projects across sessions and device restarts.

### Features
- Persist project goals and constraints.
- Break work into milestones.
- Save checkpoints.
- Record decisions and open questions.
- Resume incomplete tasks.
- Show blocked dependencies.
- Detect stale plans.
- Generate milestone summaries.
- Continue eligible remote tasks when local devices are offline.

### Recovery
After restarting, JARVIS must reconstruct state from the database, task records, canonical Markdown documents, and Git history where relevant.

It must verify task results rather than assume that every previous in-progress operation completed.

### Acceptance criteria
Test app restart during a task, recover a checkpoint, detect incomplete work, prevent accidental duplicate execution, and resume safely.

## PAGE 9 — Screen Awareness

**Purpose:** Understand the authorized desktop or mobile screen.

### Desktop functionality
- Capture the screen with permission.
- Inspect active windows.
- Extract readable text through OCR.
- Use UI Automation element information where available.
- Identify visible controls.
- Summarize the screen.
- Provide contextual guidance.
- Pass a selected screen context to a task planner.

### Android functionality
- Use supported accessibility events or node information.
- Capture visual context only where permitted.
- Respect system restrictions and the user's permissions.
- Avoid assuming every app exposes accessible element descriptions.

### Privacy controls
- Visible active-state indicator.
- Pause screen inspection.
- Stop screen inspection.
- Exclude configured apps.
- Exclude sensitive windows where feasible.
- Configurable retention of screenshots.
- Avoid saving screenshots unless the task genuinely requires them or the user requests it.

### Acceptance criteria
Verify real screen text on supported applications, show partial recognition clearly, and stop when permission is denied.

## PAGE 10 — Visual Automation Builder

**Purpose:** Build reusable automation workflows.

### Workflow format
Each workflow must store:
- Unique ID.
- Name and version.
- Trigger.
- Preconditions.
- Ordered actions.
- Optional conditions.
- Retry rules.
- Timeout rules.
- Approval requirements.
- Verification steps.
- Failure branches.
- Audit metadata.

### Triggers
- Manual run.
- Scheduled run, subject to device/runtime availability.
- File event where supported.
- Application or system event where supported.
- Approved task completion event.
- Webhook or remote event when a configured secure service exists.

### Actions
- Open an application.
- Open a permitted URL.
- Search the web.
- Read accessible UI elements.
- Click or tap supported controls.
- Type or edit text in permitted fields.
- Scroll or navigate.
- Read supported notifications.
- Process a file.
- Call an approved model/provider.
- Request confirmation.
- Generate a report.

### Safety
Destructive file operations, financial actions, credential changes, external communication, and other sensitive operations must use policy-appropriate approval and verification.

### Acceptance criteria
Create, save, reload, edit and execute a real workflow. Confirm failure handling and cancellation. Reject invalid workflow definitions.

## PAGE 11 — Windows Desktop Control

**Purpose:** Operate supported Windows applications.

### Features
- Open or focus applications.
- Switch windows.
- Read supported UI Automation elements.
- Click accessible controls.
- Enter text in supported fields.
- Use keyboard shortcuts.
- Scroll and navigate.
- Capture authorized screen context.
- Execute supported browser workflows.
- Return structured action results.

### Implementation strategy
Prefer accessible native controls and Windows UI Automation. Use mouse/keyboard automation as a limited fallback where appropriate.

### Requirements
- Use allowlists or scope restrictions for privileged actions.
- Detect when an application is not available.
- Detect whether the foreground window changed unexpectedly.
- Stop or re-evaluate when the UI state is uncertain.
- Do not claim a click succeeded without checking its result where feasible.

### Acceptance criteria
Test supported Windows versions and applications, including missing apps, changed UI layouts, denied permissions, focus loss and cancellation.

## PAGE 12 — Android App and Device Control

**Purpose:** Control supported functions on the user's own Android device.

### App control
- List eligible installed apps where Android allows it.
- Open supported applications through package launch intents.
- Handle missing or unavailable applications.
- Use explicit deep links and intents where supported.
- Report when a target app refuses the requested action.

### Touch-based control
Use Android-supported accessibility interaction, node actions, gestures, and keyboard interaction only where legitimate, authorized, and supported.

The experience should resemble normal touch-first usage. Do not show a fake desktop mouse cursor as a substitute for touch actions.

### Device controls
Implement supported functions such as:
- Flashlight.
- Volume.
- Brightness where supported.
- Camera access when authorized.
- Microphone access when authorized.
- Network and Bluetooth status inspection where permitted.
- Launching applications.
- Supported notifications.
- Supported location features.

Wi-Fi, Bluetooth, hotspot, airplane mode, screen locking and certain system settings may have OS-version or permission restrictions. Clearly mark unavailable operations instead of promising universal control.

### Dialer and calls
- Open the dialer.
- Prepare a number.
- Initiate a call only through permitted Android mechanisms and appropriate user interaction/confirmation.
- Detect and report failure.
- Do not silently bypass system call safeguards.

### Acceptance criteria
Validate each operation on a real supported Android device, including permission denial, background restrictions, missing applications and locked-screen conditions.

## PAGE 13 — Browser and Website Control

**Purpose:** Navigate and interact with websites using supported methods.

### Features
- Open URLs.
- Search.
- Read accessible web content.
- Navigate supported page elements.
- Fill allowed forms.
- Download files when permitted.
- Save page references.
- Extract source citations.
- Check navigation results.
- Track timeouts and network failures.

### Preferred implementation
Use documented browser automation or web APIs. Select the appropriate method for the task rather than relying exclusively on visual clicking.

### Restrictions
JARVIS must not bypass authentication, CAPTCHAs, paywalls, access controls or security protections. The user completes secure authentication when necessary.

Payments and irreversible submissions need explicit user approval at the appropriate point.

### Acceptance criteria
Test navigation, loading timeouts, unavailable websites, expired sessions, changed page layouts, and manual authentication handoff.

## PAGE 14 — Communication and Messaging Automation

**Purpose:** Assist with supported messaging and email workflows.

### Features
- Open supported communication apps.
- Read permitted notification content.
- Draft messages.
- Populate message fields where supported.
- Prepare voice-message workflows if the target app and OS permit them.
- Inspect available send controls.
- Show a confirmation preview before consequential external sends when policy requires it.
- Store task status without unnecessarily retaining private message content.

### Rules
- Do not claim a message was sent until success is verified.
- Do not pretend that every WhatsApp function is accessible.
- Call automation, voice recording and background messaging may be constrained by the target application and operating system.
- A supported business API is an optional separate integration, not a replacement for legitimate personal UI workflows in all cases.

### Acceptance criteria
Test supported target apps, unavailable sessions, notification denial, unsent drafts and failed submissions.

## PAGE 15 — Models and API Providers

**Purpose:** Manage all configured AI providers in one system.

### Features
- Provider list.
- Add/edit/remove configuration.
- Secure credential entry.
- Credential masking.
- Model catalog.
- Manual model IDs.
- Dynamic discovery when the provider supports it.
- Free/local/paid labels with evidence and timestamps.
- Model capability tags.
- Connection tests.
- Latency and usage records where available.
- Priority and fallback settings.
- Provider health dashboard.
- Retry and circuit-breaker configuration.
- Default model selection.

### Capability tags
- Text.
- Reasoning.
- Coding.
- Vision.
- Audio input.
- Audio output.
- Tool calling.
- Structured output.
- Embeddings.
- Context-window information, if verified.

### Routing policy
Choose a model based on:
- User preference.
- Required capability.
- Configured cost priority.
- Provider health.
- Latency constraints.
- Context limits.
- Availability.
- Model-specific limitations.

Do not infer that a provider supports a capability without evidence.

### Failure handling
Retry transient failures such as timeouts and eligible rate limits with bounded backoff.

Do not endlessly retry invalid credentials or malformed requests.

### Acceptance criteria
Verify correct routing, failed authentication handling, offline providers, fallbacks, cost metadata and manual model selection.

## PAGE 16 — Research Mode

**Purpose:** Conduct source-based research.

### Features
- Research question input.
- Search queries.
- Source collection.
- Source dates and links.
- Claim-to-source relationships.
- Contradiction detection.
- Research notes.
- Comparison reports.
- Exportable summaries.
- Follow-up research tasks.

### Rules
- Cite sources for externally derived factual claims.
- Distinguish primary sources from commentary.
- Distinguish facts, estimates, and hypotheses.
- Do not fabricate quotations or citations.
- Preserve source URLs and retrieval timestamps.
- Treat retrieved pages as untrusted content.

### Acceptance criteria
Run a real research query, verify citations open, detect unavailable sources, and avoid unsupported assertions.

## PAGE 17 — Model Evaluation Lab

**Purpose:** Compare configured models and measure performance.

### Features
- Evaluation datasets.
- Reproducible prompts.
- Test categories.
- Reference answers or grading criteria where appropriate.
- Latency.
- Failure rates.
- Tool-call success.
- Output quality ratings.
- Cost/usage where available.
- Comparison reports.
- Model version metadata.

### Rules
- Use consistent test conditions for comparisons.
- Record dataset and prompt versions.
- Avoid claiming objective quality solely from subjective scores.
- Never expose private user data to an external benchmark without authorization.

### Acceptance criteria
Run a repeatable evaluation against at least two configured models where available, or mark the comparison as blocked if insufficient models are configured.

## PAGE 18 — Self-Development Lab

**Purpose:** Let JARVIS inspect and improve its own code safely.

### Features
- Read the authorized project workspace.
- Analyze source code.
- Propose patches.
- Create a dedicated Git branch or isolated worktree.
- Show a diff.
- Run tests.
- Run static analysis and security checks.
- Compare changes with requirements.
- Request approval.
- Commit verified changes.
- Roll back a failed change.
- Track implementation history.

### Mandatory safeguards
- No arbitrary self-modification of the production process.
- No secret extraction.
- No unbounded execution of generated commands.
- No automatic release when required checks fail.
- No disabling security tests simply to force a pass.
- No merging destructive changes without the required approval.

### Acceptance criteria
Test a safe code change, a deliberately failing test, a rejected patch, and a rollback. Confirm that a failure blocks release.

## PAGE 19 — Model Evolution Lab

**Purpose:** Improve model selection and evaluate optional model adaptation.

### Features
- Model performance history.
- Prompt/version comparison.
- Dataset management.
- Evaluation reports.
- Local model discovery where supported.
- Fine-tuning workflow planning.
- Resource estimation.
- Adapter/checkpoint metadata.
- Model version registry.
- Rollback to an earlier selected model.

### Training policy
Document clearly whether a procedure is:
- Retrieval/indexing.
- Prompt optimization.
- Provider selection.
- Fine-tuning.
- Full model training.

Do not call document ingestion “model training.” Fine-tuning requires compatible training infrastructure, a suitable base model, data preparation and sufficient resources.

## PAGE 20 — Universal File Intelligence

**Purpose:** Process, search, summarize and transform supported files.

### Features
- File picker.
- Batch imports.
- Format detection.
- Preview.
- Metadata.
- OCR.
- Audio transcription.
- Video frame sampling and transcription where configured.
- Source code analysis.
- Spreadsheet structure extraction.
- Semantic/keyword search.
- Task queue.
- Processing history.
- Exported results.
- Failure reports.

### Data integrity
- Never overwrite original user files by default.
- Use separate output paths.
- Verify output existence and integrity.
- Preserve source references.
- Require approval for bulk deletion or replacement.

### Acceptance criteria
Run a representative set of supported files through the real handlers and verify output, error handling, and source preservation.

## PAGE 21 — God's Eye

**Purpose:** Integrate a geographic/globe interface inside JARVIS.

### Reference repository
https://github.com/bilawalsidhu/gods-eye-view

### Requirements
- Review the repository's current licence and dependencies.
- Inspect the implementation and supported map layers.
- Reuse or adapt components only when legally and technically appropriate.
- Integrate the globe into the JARVIS UI rather than merely opening a separate external app.
- Display genuine source-backed map content.
- Support layer controls, search, and navigation where available.
- Provide attribution according to the relevant licences.
- Require authorized permissions for device-location features.
- Provide a clear offline or unavailable state when map services cannot load.

### Acceptance criteria
The globe loads real supported geographic data, controls change the actual layer/view, and service failures are visible.

## PAGE 22 — Hologram Studio

**Purpose:** Personalize JARVIS's visual identity.

### Features
- Select available avatar styles.
- Adjust supported visual properties.
- Choose animation intensity.
- Configure audio-reactive behavior.
- Connect animation to actual assistant states.
- Preview the selected style.
- Save and restore user preferences.
- Reduce motion.
- Handle missing assets.

### Rules
The preview must be labeled as a preview until saved. Do not bundle unlicensed assets or present unsupported lip-sync capabilities as complete.

## PAGE 23 — Security and Permissions Centre

**Purpose:** Centralize access controls and security visibility.

### Features
- Permission inventory.
- Current authorization status.
- Last-checked timestamp.
- Grant/revoke guidance.
- App-specific allowlists and exclusions.
- Active automation sessions.
- Sensitive-action approvals.
- Audit log.
- Offline/privacy mode.
- Credential masking.
- Device authentication.
- Security warnings.

### Permission scopes
Separate scopes for:
- Screen capture.
- Keyboard/mouse automation.
- Android accessibility.
- Notifications.
- Microphone.
- Camera.
- Location.
- Files.
- External network access.
- Provider/model use.
- Remote workers.
- Shell/command execution.
- Self-development operations.

### Rules
Request permissions when needed, explain why, and provide a way to stop supported activity. A permission denial must not cause the app to repeatedly prompt or secretly use another method.

## PAGE 24 — Task Centre

**Purpose:** Provide one place to see every active, queued and completed job.

### Features
- Active tasks.
- Queued tasks.
- Paused tasks.
- Completed tasks.
- Failed tasks.
- Partial results.
- Task details.
- Step-level progress.
- Cancellation.
- Retry.
- Resume.
- Logs and evidence.
- Device/worker assignment.
- Artifact links.
- Dependency information.

### Acceptance criteria
Task status stays consistent across refreshes and app restarts. The interface distinguishes actual progress from unknown progress.

## PAGE 25 — Logs and Diagnostics

**Purpose:** Show detailed technical errors in an accessible interface.

### Required fields
- Timestamp.
- Severity.
- Component.
- Task ID.
- Device or worker.
- Action/operation.
- Error class/code.
- Human-readable message.
- Stack trace when available.
- Retry attempt.
- Correlation ID.
- Related evidence/artifact references.
- Recovery action and outcome.

### Features
- Search.
- Filter.
- Sort.
- Task-linked logs.
- Exportable diagnostic bundles.
- Retention settings.
- Redaction preview.

### Privacy
Redact API keys, passwords, tokens, OTPs, payment data and other sensitive values. Do not dump private message content or full user documents into logs by default.

### Acceptance criteria
Trigger a controlled error in a real integration, show the relevant trace, verify redaction, and export a diagnostic report.

## PAGE 26 — Built-in Health Monitor

**Purpose:** Monitor the real application components.

### Health checks
- Frontend/backend connectivity.
- Database availability.
- Migration status.
- Memory/index storage.
- Provider endpoints.
- Task queue and workers.
- Voice devices and providers.
- Screen/device adapters.
- Disk-space warnings.
- Backup status.
- Last successful backup.
- Sync connectivity.
- Pending recovery tasks.

### Rules
Every status must include a last-checked time where relevant. If health cannot be determined, display `UNKNOWN`, not `HEALTHY`.

### Acceptance criteria
Test unavailable database, unavailable provider, worker failure, insufficient storage, and backup failure.

## PAGE 27 — Backup and Recovery Centre

**Purpose:** Protect project configuration, memory, task records, and user data.

### Features
- Create backup.
- View recovery points.
- Validate backup integrity.
- Restore a selected recovery point.
- Export eligible user data.
- Inspect backup contents.
- Report incomplete backups.
- Configure storage destinations.
- Configure retention.
- Verify checksum and migration compatibility.

### Backup policy
Include, as configured:
- Application configuration excluding raw secrets.
- Memory records.
- Project metadata.
- Task records.
- Database snapshots.
- Required project documentation.
- Model configuration metadata.
- Safe user-approved knowledge metadata.
- Encrypted private vault backup when supported.

Large models and private source documents may require separate configurable storage.

### Restore policy
Never overwrite a newer database silently. Inspect the target, create a pre-restore backup when possible, check compatibility, and request confirmation for destructive restoration.

### Acceptance criteria
Create a backup, validate its checksum, restore it into a clean environment, and verify the recovered records.

## PAGE 28 — USB Recovery Drive

**Purpose:** Help restore JARVIS on another compatible computer or device.

### Contents
- Windows installer.
- Android APK when available.
- Recovery instructions.
- Application version manifest.
- Required documentation.
- Optional verified model files.
- Encrypted backup bundle when authorized.
- Checksums and signatures where available.

### Rules
- Do not include raw API keys or unencrypted credentials.
- Do not assume USB insertion automatically runs programs.
- Do not claim an APK is installed merely because it is copied.
- Do not assume a Windows installer can restore all Android device settings.
- Keep the recovery process explicit and user-authorized.

### Acceptance criteria
Build a recovery package, validate its manifest and checksums, and test the recovery procedure on a separate supported environment.

## PAGE 29 — Cross-Device Handoff

**Purpose:** Share task and project state across Windows and Android.

### Features
- Device registration.
- Authenticated synchronization.
- Task assignment.
- Shared project identifiers.
- Task ownership/leases.
- Offline queue.
- Sync status.
- Conflict detection.
- Manual reassignment.
- Reconnection recovery.
- Remote worker configuration.

### Rules
- Do not expose a local control API directly to the public internet.
- Authenticate remote requests.
- Encrypt transport.
- Minimize synced personal data.
- Never assume an offline device completed its pending operation.
- Do not execute the same non-idempotent action on two devices accidentally.

### Acceptance criteria
Create a task on one device, synchronize it to another, take one device offline, reconnect, resolve a test conflict and verify the final task history.

## PAGE 30 — Settings and Customization

### Categories
- General.
- Appearance.
- Voice.
- Languages.
- AI providers.
- Models.
- Memory.
- File processing.
- Automation.
- Notifications.
- Device pairing.
- Privacy.
- Security.
- Backups.
- Storage.
- Advanced diagnostics.
- About and updates.

### Requirements
- Validate all settings.
- Explain changes that require restart.
- Preserve preferences across upgrades.
- Reject invalid provider URLs and malformed configuration.
- Mask sensitive values.
- Provide restore-default controls with confirmation.

## PAGE 31 — Onboarding and Setup Wizard

**Purpose:** Make a new installation usable without hiding missing prerequisites.

### Steps
1. Welcome and privacy overview.
2. Choose local-first or configured hybrid execution.
3. Check application health.
4. Configure a model/provider or explicitly choose local-only capabilities.
5. Configure voice if desired.
6. Explain and request relevant permissions when needed.
7. Run an actual connection/self-check.
8. Offer memory and backup setup.
9. Create a sample task that performs a real harmless action.
10. Show the final capability report.

Do not force users to supply a paid API key when they intend to use supported local capabilities.

## PAGE 32 — Admin and Project Control

**Purpose:** Give the project administrator clear operational control.

### Features
- Current project version.
- Git state, when accessible.
- Phase status.
- Build status.
- Last verified tests.
- Current blockers.
- Open tasks.
- Current backup state.
- Recent changes.
- Documentation completeness.
- Release readiness.
- Recovery tools.

Only include GitHub information that has actually been retrieved and verified.

---

# PART 6 — CORE BACKEND SERVICES

Implement the following as separate, testable services.

## 6.1 Command planner

Converts natural-language requests into structured tasks.

Must produce:
- Intent.
- Target device.
- Preconditions.
- Ordered actions.
- Permission requirements.
- Risk classification.
- Required verification.
- Expected completion state.

The planner must not execute a plan that fails validation.

## 6.2 Task orchestrator

Responsible for:
- Task persistence.
- Queueing.
- Dependencies.
- State transitions.
- Retries.
- Cancellation.
- Checkpoints.
- Ownership/leases.
- Artifacts.
- Recovery after process restart.

## 6.3 Provider router

Responsible for:
- Provider configuration.
- Model capabilities.
- Routing rules.
- Health checks.
- Rate limits.
- Timeouts.
- Fallback policy.
- Usage and cost metadata.
- Error classification.

## 6.4 Memory service

Responsible for:
- Memory records.
- Project context.
- Search.
- Source references.
- User corrections.
- Retention and deletion.
- Export and import.
- Backup compatibility.

## 6.5 File processing service

Use a handler registry for:
- Extraction.
- OCR.
- Transcription.
- Chunking.
- Indexing.
- Format validation.
- Preview generation.
- Error recovery.

Each handler must report its capabilities and known limitations.

## 6.6 Automation service

Responsible for:
- Workflow validation.
- Permission checks.
- Adapter selection.
- Action execution.
- Timeouts.
- Cancellation.
- Result verification.
- Sensitive-action approval.
- Audit records.

## 6.7 Platform adapters

Keep Windows, Android, browser, filesystem, audio, and device-specific integrations behind explicit interfaces.

A missing adapter must result in an explicit unsupported status, not a fabricated success.

## 6.8 Diagnostics service

Centralize:
- Structured logs.
- Task correlation IDs.
- Error classifications.
- Health checks.
- Redaction.
- Diagnostic export.
- Retention.

## 6.9 Backup and restore service

Responsible for:
- Snapshots.
- Checksums.
- Version manifests.
- Retention.
- Integrity verification.
- Migration-aware restore.
- Recovery reports.

---

# PART 7 — MEMORY, DOCUMENTATION, AND CONTEXT RECOVERY

This is a mandatory subsystem, not an optional convenience.

## 7.1 Required project documents

### `AGENTS.md`
Defines mandatory coding-agent behavior, repository rules, safe execution, tests, commits, documentation and recovery.

### `implement_plan.md`
Contains:
- Project objectives.
- Architecture decisions.
- Phases.
- Task dependencies.
- Acceptance criteria.
- Completed and pending work.
- Blockers.
- Next actions.

### `workflow.md`
Contains:
- How the project is structured.
- How to set up the environment.
- How to develop.
- How to run tests.
- How to build.
- How to release.
- How to recover after interruption.
- How documentation and task state must be updated.

### `data.md`
Contains:
- Database entities.
- Field definitions.
- Relationships.
- Migrations.
- Retention rules.
- Encryption boundaries.
- Backup/restore rules.
- Data deletion behavior.
- Indexing design.
- Sync behavior.
- Schema version history.

Do not store raw credentials in this document.

### `test.md`
Contains:
- Test strategy.
- Test commands.
- Unit test inventory.
- Integration test inventory.
- Platform acceptance tests.
- Security tests.
- Regression tests.
- Build verification.
- Last actual result and timestamp.
- Known failures.
- Test evidence links or artifact paths.

Never invent test results.

### `task.md`
Contains the task register.

Every task should include:
- Unique ID.
- Title.
- Feature ID.
- Priority.
- Status.
- Dependencies.
- Implementation notes.
- Acceptance criteria.
- Files changed.
- Tests run.
- Evidence.
- Blockers.
- Next action.

### `memory.md`
Contains a compact but useful human-readable continuity record for the coding agent.

It must include:
- Project identity and goals.
- Canonical architecture.
- Repository structure summary.
- Current branch and known Git status, when verified.
- Current implementation phase.
- Completed verified work.
- Work in progress.
- Remaining work.
- Major decisions and their rationale.
- Known bugs and blockers.
- Relevant database schema version.
- Last successful test/build evidence.
- Backup/recovery references.
- Next exact action.
- Date/time of last update.

Do not copy the entire source code into memory. Do not store credentials, private keys, raw API tokens, OTPs or unencrypted private data.

### `README.md`
Contains setup, prerequisites, feature overview, supported platforms, development commands, test commands and build instructions.

### `ARCHITECTURE.md`
Contains component boundaries, runtime architecture, data flow, provider flow, task flow, platform adapters, and diagrams.

### `SECURITY.md`
Contains the threat model, security controls, credential handling, permission scopes, trust boundaries, incident handling and vulnerability reporting procedure.

### `PRIVACY.md`
Contains data collected/processed, data retention, local/cloud processing, user controls, exports, deletion, and diagnostic redaction.

### `CHANGELOG.md`
Records meaningful user-facing changes and release versions.

### Additional documentation
Create and maintain:
- `CONTRIBUTING.md`
- `TROUBLESHOOTING.md`
- `RELEASE.md`
- `API.md` or generated API documentation.
- `ADR/` architectural decision records.
- `docs/` for feature-specific documentation.

Create the requested files before feature implementation, then update them as real decisions and code changes occur.

## 7.2 `/memory` command behavior

When the administrator issues `/memory`, the agent must:

1. Read the existing `memory.md`.
2. Inspect the actual repository, Git history, current branch, and relevant diffs.
3. Read `implement_plan.md`, `workflow.md`, `data.md`, `test.md`, and `task.md`.
4. Inspect available task records, release metadata and recovery manifests.
5. Resolve contradictions using canonical files and verified repository state, not guesses.
6. Update `memory.md`.
7. Update `task.md` and `implement_plan.md` when their actual state has changed.
8. Record missing context and uncertainty explicitly.
9. Create a versioned recovery snapshot when configured.
10. Commit appropriate non-sensitive documentation changes.
11. Push to GitHub if authenticated, authorized, and available.
12. Report the exact files updated and whether the remote push succeeded.

Do not rewrite a historical record as if the agent had perfect recall. Mark missing information as unknown and recover it from Git history or backups where possible.

## 7.3 What happens if the agent loses its context?

The recovery protocol is mandatory.

When a new agent session starts, or the previous context is missing:

1. Read `AGENTS.md`.
2. Read `README.md`.
3. Read `memory.md`.
4. Read `implement_plan.md`.
5. Read `workflow.md`.
6. Read `task.md`.
7. Read `data.md` and `test.md`.
8. Inspect Git status and recent commits.
9. Inspect the most recent validated backup manifest.
10. Compare claimed status against the actual files and tests.
11. Rebuild a verified list of completed, incomplete, and uncertain work.
12. Resume from the earliest incomplete task whose dependencies are satisfied.

Do not regenerate or overwrite the whole project merely because conversation context is missing.

## 7.4 Memory recovery must not depend on one file

A single `memory.md` file cannot protect against deletion of the entire working directory, Git history, and all backups.

Implement several recovery layers:

**Layer A — Canonical project memory**

Version-controlled Markdown files in Git.

**Layer B — Git history**

Small, meaningful commits and recovery tags for verified milestones.

**Layer C — Remote GitHub repository**

Push committed source and documentation when authenticated and authorized.

**Layer D — Versioned backup snapshots**

Back up project metadata, memory and selected application state separately from the working tree.

**Layer E — Independent private backup**

Where configured, use another user-controlled storage destination with encryption and restricted access.

**Layer F — Database and runtime recovery**

Use transaction-safe snapshots, schema versions and restore verification.

The agent should be able to reconstruct the project's status from the strongest available surviving layers.

If all copies of some data have been destroyed, the agent must say that the data is unrecoverable rather than pretending to restore it.

## 7.5 Automatic checkpoint policy

Create a checkpoint after:
- Completing a meaningful feature.
- Passing a phase's acceptance tests.
- Completing a database migration.
- Updating critical architecture decisions.
- Before a risky database migration.
- Before a release build.
- Before a major refactor.
- Before destructive restore operations.

Do not create a Git commit after every insignificant keystroke. Checkpoints should be useful and understandable.

## 7.6 Conflict resolution

When `memory.md`, `task.md`, Git history and the live repository disagree:
- Prefer the actual files and verified test evidence for current implementation state.
- Prefer Git history for historical changes.
- Prefer explicit accepted decisions and documented ADRs for architecture decisions.
- Preserve unresolved contradictions in the audit report.
- Never delete a potentially useful record merely to eliminate a contradiction.

---

# PART 8 — DATA MODEL REQUIREMENTS

Design a versioned relational schema before implementing the business logic.

At minimum, evaluate and define the following entities.

## 8.1 User and application configuration
- `user_preferences`
- `app_settings`
- `device_registry`
- `permission_records`

## 8.2 AI provider configuration
- `providers`
- `models`
- `provider_capabilities`
- `provider_health_checks`
- `provider_usage_records`

Provider secrets must be stored in an OS credential store or an appropriate encrypted secret mechanism when supported. Prefer a secret reference over storing plaintext credentials in SQLite.

## 8.3 Memory and knowledge
- `memory_records`
- `memory_sources`
- `projects`
- `project_decisions`
- `documents`
- `document_chunks`
- `document_processing_jobs`
- `knowledge_relationships`

## 8.4 Tasks and automation
- `tasks`
- `task_steps`
- `task_dependencies`
- `task_artifacts`
- `task_events`
- `agent_runs`
- `workflow_definitions`
- `workflow_versions`
- `workflow_runs`
- `action_approvals`

## 8.5 Diagnostics
- `audit_events`
- `error_records`
- `health_checks`
- `backup_records`
- `sync_records`

## 8.6 Required schema behavior
- Stable identifiers.
- Creation and update timestamps.
- Explicit state enums.
- Foreign-key constraints where suitable.
- Indexes for actual query paths.
- Atomic transitions for task status.
- Versioned migrations.
- Data retention and deletion rules.
- Consistent backup serialization.

Use a UTC storage convention for persisted timestamps and render local time appropriately in the UI.

Do not store arbitrary unvalidated JSON where a typed schema is practical. Use JSON for genuinely variable payloads with explicit versioning and validation.

---

# PART 9 — API AND SERVICE CONTRACTS

Design and document typed API interfaces before wiring all UI components.

The final endpoints may differ based on the architecture, but the following operations must be covered.

## 9.1 Health
- Read system health.
- Read component health.
- Check database status.
- Check provider status.
- Check worker status.

## 9.2 Providers
- List providers.
- Add/update/remove a provider.
- Discover models.
- Validate a configuration.
- Run a connection check.
- Set model priorities.
- Configure routing preferences.

Never return secret values to the frontend.

## 9.3 Tasks
- Create a task.
- Read task details.
- List tasks.
- Approve a pending action.
- Pause/resume a task.
- Cancel a task.
- Retry an eligible failure.
- Read task events.
- Read artifacts.
- Read execution evidence.

## 9.4 Memory
- Create a memory record.
- Search/list memory.
- Inspect a record.
- Update a record.
- Delete a record.
- Export data.
- Import a validated recovery bundle.

## 9.5 Files
- Register an import.
- Read processing status.
- Retry a failure.
- Read metadata and extracted content.
- Search indexed documents.
- Delete selected indexed records.
- Export results.

## 9.6 Workflows
- Create/update a definition.
- Validate a workflow.
- Run a workflow.
- Approve an action.
- Inspect execution.
- Cancel a run.
- Read the audit record.

## 9.7 Administration and recovery
- Read project status.
- Read diagnostics.
- Create a backup.
- Validate a backup.
- List recovery points.
- Restore a selected backup.
- Export a sanitized diagnostic bundle.

All APIs must have typed input/output models, validation, authentication as appropriate, bounded timeouts, and structured errors.

---

# PART 10 — ERROR HANDLING AND LOCKED STATES

Every operation must return a structured result.

## 10.1 Standard statuses

Use consistent statuses such as:
- `AVAILABLE`
- `READY`
- `RUNNING`
- `WAITING`
- `NEEDS_APPROVAL`
- `PERMISSION_REQUIRED`
- `AUTHENTICATION_REQUIRED`
- `LOCKED`
- `UNSUPPORTED`
- `UNAVAILABLE`
- `OFFLINE`
- `PARTIAL`
- `FAILED`
- `CANCELLED`

Do not use these statuses interchangeably.

## 10.2 Error categories

At minimum classify:
- Validation error.
- Configuration error.
- Permission error.
- Authentication error.
- Network timeout.
- Rate limit.
- Provider unavailable.
- Unsupported capability.
- Application unavailable.
- Selector/UI mismatch.
- File extraction failure.
- Database failure.
- Migration failure.
- Worker failure.
- Sync conflict.
- Backup failure.
- Integrity failure.
- Security policy rejection.
- Unknown failure.

## 10.3 User-visible failure behavior

When a website or app is inaccessible:
1. Stop safely.
2. Capture relevant non-sensitive diagnostic details.
3. Classify the failure.
4. Show the appropriate status.
5. Give the reason when known.
6. Show the next safe step.
7. Offer retry only when appropriate.
8. Preserve the task history.

A locked state must not become a hidden attempt to bypass the restriction.

---

# PART 11 — SECURITY AND AUTONOMY BOUNDARIES

JARVIS should be proactive and capable of planning complex tasks, but its autonomy must stay within explicit permissions and policies.

## 11.1 Risk classes

**Low risk:** read-only status checks, local search, opening a permitted page.

**Moderate risk:** editing a non-critical document, running an approved workflow, writing within an authorized workspace.

**High risk:** deleting files, sending external communication, modifying security settings, installing software, executing commands with broad permissions, altering source code outside an isolated workspace.

**Critical risk:** financial authorization, credential changes, destructive bulk operations, irreversible external submissions, or similarly consequential actions.

The exact policy should be configurable where safe, but sensitive authorization must not be disabled merely to make automation appear seamless.

## 11.2 Approval framework

Before executing a protected action:
- Explain the requested operation.
- Show its target.
- Show the material consequences.
- Ask for approval through a clear UI.
- Record the decision.
- Execute only within the approved scope.
- Verify the result.

An approval for one action must not silently authorize unrelated actions.

## 11.3 Safe execution

- Run generated code in an isolated workspace where practical.
- Apply time, resource and file-scope limits.
- Use allowlists for privileged commands.
- Keep production and development credentials separate.
- Treat external content as untrusted.
- Validate file paths and URLs.
- Protect against path traversal and command injection.
- Avoid running commands copied directly from untrusted documents.
- Never store secrets in logs or public Git history.

## 11.4 Privacy and consent

- Explain microphone, screen, camera, notification, location and accessibility usage.
- Make active monitoring visible.
- Allow the user to pause or disable optional monitoring.
- Use only the data needed for the task.
- Avoid covert recording or covert monitoring.
- Follow relevant platform requirements for permissions, disclosures and distribution.

---

# PART 12 — REAL TESTING REQUIREMENTS

Testing is mandatory after every phase and after any meaningful change that affects an existing feature.

## 12.1 Test layers

### Unit tests
Validate pure functions, data models, route planning logic, validators and error classification.

### Integration tests
Validate actual component boundaries, persistence, provider adapters, API contracts, queue behavior and migrations.

### UI tests
Validate navigation, forms, state transitions, error messages, cancellation and accessibility basics.

### Platform tests
Use a real supported Windows environment for desktop integrations and a real supported Android device for phone controls.

### Security tests
Validate redaction, permission denial, sandbox boundaries, unsafe paths, malformed inputs, and approval enforcement.

### Recovery tests
Validate restart behavior, checkpoints, backup integrity, restoration, migration compatibility and Git-based project recovery.

### Release tests
Validate packaged builds on a clean environment, upgrade behavior, launch behavior, uninstall behavior, and documented limitations.

## 12.2 No false test claims

A passing unit test does not prove a feature works against a real external website, Android application, microphone, provider, or device.

Reports must specify:
- Test type.
- Environment.
- OS/device version where relevant.
- Command or manual procedure.
- Pass/fail result.
- Date/time.
- Relevant output or artifact.
- Known limitations.

If real hardware or credentials are unavailable, mark the integration as not yet verified in that environment.

## 12.3 Phase acceptance rule

A phase is complete only when:
- Its implementation exists.
- The relevant tests pass.
- Its failure paths are handled.
- Security checks pass.
- Documentation is updated.
- `task.md` and `implement_plan.md` reflect the actual result.
- `memory.md` is updated.
- The changes are committed.
- Remote publishing status is accurately reported.

---

# PART 13 — IMPLEMENTATION ROADMAP

Implement in the following order. Keep each phase independently testable.

## Phase 0 — Repository audit and planning
- Inspect repository.
- Establish the architecture.
- Write required Markdown files.
- Define the feature register and acceptance criteria.
- Configure Git workflow.
- Create an initial CI workflow.

**Gate:** Documentation consistency review passes. Existing work remains intact.

## Phase 1 — Foundation
- Set up the React/TypeScript desktop UI.
- Set up the Tauri desktop shell.
- Set up the Python/FastAPI backend.
- Set up the database and migrations.
- Set up structured logs and health checks.
- Create the Android project skeleton.
- Implement basic application lifecycle and configuration.

**Gate:** Reproducible development build, tests, database migration checks and actual frontend/backend health request pass.

## Phase 2 — Design system and navigation
- Implement the design tokens.
- Build shared components.
- Build desktop top navigation.
- Build mobile navigation.
- Implement error/loading/empty states.
- Implement settings and onboarding foundations.

**Gate:** All declared routes render, controls work, and UI state uses real data.

## Phase 3 — Providers and voice
- Build the provider registry.
- Add secure credential references.
- Add connection checks and model routing.
- Build speech input/output adapters.
- Add the actual voice state machine.
- Add task command parsing.

**Gate:** A configured provider and supported voice path work in a real environment; unavailable services fail cleanly.

## Phase 4 — Persistent memory and files
- Implement the memory service.
- Implement project context.
- Implement the knowledge vault.
- Add file extraction handlers.
- Add indexing and search.
- Add export, deletion and retention controls.

**Gate:** Persistence, indexing, retrieval, deletion, backups and file failure reporting pass tests.

## Phase 5 — Command centre and agent orchestration
- Implement the task state machine.
- Implement the planner.
- Implement task checkpoints.
- Implement the multi-agent orchestration layer.
- Implement retry and cancellation.
- Implement long-running project records.

**Gate:** Real tasks are persisted, inspected, cancelled, resumed and recovered correctly.

## Phase 6 — Desktop control and screen awareness
- Implement approved Windows control adapters.
- Implement screen capture and OCR.
- Implement supported accessibility/UI element discovery.
- Implement browser workflows.
- Add permission and risk checks.
- Add result verification.

**Gate:** Real supported Windows actions pass integration tests; unsupported actions are reported clearly.

## Phase 7 — Android application and device control
- Implement the native Kotlin UI.
- Connect shared task and memory APIs.
- Implement supported app launching.
- Implement authorized accessibility interactions.
- Implement notifications and supported device controls.
- Implement Android-specific permission and failure handling.

**Gate:** Real device tests pass for each declared supported capability.

## Phase 8 — Workflow builder and self-development
- Implement visual workflow definitions.
- Add workflow validation.
- Add execution policies.
- Implement isolated source changes.
- Integrate tests and security scans.
- Implement diff review and rollback.
- Build the model evaluation lab.

**Gate:** Unsafe actions are rejected or require approval, failing tests block release, and rollback is verified.

## Phase 9 — Advanced modules
- Integrate God's Eye.
- Complete the hologram studio.
- Add research reports with citations.
- Extend universal file intelligence.
- Implement daily briefing and reminders.
- Add productivity utilities and knowledge graph views.

**Gate:** Every advanced module has working integrations, real status, tests and documented requirements.

## Phase 10 — Reliability, recovery and release
- Complete cross-device synchronization.
- Deploy and test the optional remote worker if configured.
- Complete backup and recovery.
- Complete USB recovery packaging.
- Finalize the installer and Android APK.
- Run security review.
- Run upgrade, clean-machine, failure and restore tests.
- Publish the release documentation.

**Gate:** Release checklist passes, or every unmet item is explicitly listed and blocks a full-release claim.

---

# PART 14 — RECOMMENDED REPOSITORY STRUCTURE

Adapt this structure to the existing repository instead of destroying existing valid content.

```text
jarvis/
├── AGENTS.md
├── README.md
├── PRD.md
├── ARCHITECTURE.md
├── implement_plan.md
├── workflow.md
├── data.md
├── test.md
├── task.md
├── memory.md
├── SECURITY.md
├── PRIVACY.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── TROUBLESHOOTING.md
├── RELEASE.md
├── API.md
├── .gitignore
├── .editorconfig
├── .env.example
├── package.json
├── pnpm-lock.yaml
├── pyproject.toml
├── uv.lock
├── docs/
│   ├── features/
│   ├── decisions/
│   ├── recovery/
│   ├── testing/
│   └── screenshots/
├── ADR/
│   ├── 0001-desktop-runtime.md
│   ├── 0002-backend-runtime.md
│   └── 0003-memory-and-backup.md
├── apps/
│   ├── desktop/
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── features/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── state/
│   │   │   ├── styles/
│   │   │   ├── types/
│   │   │   └── main.tsx
│   │   ├── public/
│   │   └── src-tauri/
│   │       ├── Cargo.toml
│   │       ├── tauri.conf.json
│   │       ├── capabilities/
│   │       └── src/
│   └── android/
│       ├── settings.gradle.kts
│       ├── build.gradle.kts
│       └── app/
│           └── src/
│               ├── main/
│               ├── test/
│               └── androidTest/
├── backend/
│   ├── pyproject.toml
│   ├── src/
│   │   └── jarvis/
│   │       ├── api/
│   │       ├── core/
│   │       ├── config/
│   │       ├── database/
│   │       ├── models/
│   │       ├── schemas/
│   │       ├── repositories/
│   │       ├── services/
│   │       ├── providers/
│   │       ├── agents/
│   │       ├── memory/
│   │       ├── files/
│   │       ├── automation/
│   │       ├── platform/
│   │       ├── diagnostics/
│   │       └── recovery/
│   ├── migrations/
│   └── tests/
│       ├── unit/
│       ├── integration/
│       ├── security/
│       └── recovery/
├── scripts/
│   ├── dev/
│   ├── test/
│   ├── build/
│   ├── backup/
│   ├── restore/
│   └── release/
├── backups-manifest/
│   └── README.md
└── .github/
    ├── workflows/
    ├── ISSUE_TEMPLATE/
    └── pull_request_template.md
```

Do not create empty folders or hundreds of placeholder files simply to match this diagram. Create a folder when its feature or shared architecture requires it.

Select one package manager and one Python environment/lockfile workflow, document the choice, and keep it consistent. Do not create conflicting lockfiles from multiple tools.

---

# PART 15 — DEFINITION OF DONE

A task is not done because its code exists.

A task is complete only when all applicable items below are satisfied.

- [ ] Requirement mapped to a feature/task ID.
- [ ] Implementation completed.
- [ ] Real application state connected.
- [ ] Relevant unit tests pass.
- [ ] Relevant integration tests pass.
- [ ] Error and cancellation paths verified.
- [ ] Permissions handled correctly.
- [ ] Security and data privacy requirements reviewed.
- [ ] Relevant regression tests pass.
- [ ] Documentation updated.
- [ ] Data/schema documentation updated if applicable.
- [ ] `task.md` updated.
- [ ] `implement_plan.md` updated.
- [ ] `memory.md` updated.
- [ ] Recovery checkpoints created where required.
- [ ] Git diff reviewed.
- [ ] Commit created.
- [ ] GitHub push status accurately reported.
- [ ] Remaining limitations listed.

A phase that fails its acceptance tests must remain incomplete.

---

# PART 16 — RELEASE AND INSTALLATION REQUIREMENTS

## Windows
- Produce a Windows installer.
- Bundle the required runtime/backend dependencies using a verified packaging approach.
- Do not require the end user to manually install Python or Node.js unless that is explicitly documented as a prerequisite.
- Detect missing operating-system prerequisites.
- Avoid bundling large model weights unnecessarily.
- Provide update, uninstall and recovery instructions.
- Test the package on a clean Windows environment.
- Verify that runtime paths and user data directories work after installation.

## Android
- Produce an installable APK for the intended test/distribution environment.
- Document required Android version and permissions.
- Test install, launch, upgrade and uninstall behavior.
- Validate permission disclosures.
- Verify background restrictions and battery behavior.
- Do not treat copying the APK to a device as proof that installation succeeded.

## Update and migration policy
- Back up relevant state before risky migrations where possible.
- Validate schema compatibility.
- Stop safely if migration fails.
- Provide an appropriate rollback/recovery path.
- Preserve user data during upgrades.
- Document incompatible changes clearly.

---

# PART 17 — EXTERNAL REPOSITORIES AND REFERENCES

## God's Eye View
https://github.com/bilawalsidhu/gods-eye-view

Use this as a candidate integration reference. Inspect the actual current source, licence, dependencies, supported map layers and security implications before deciding what can be reused.

Integrate supported functionality into JARVIS where practical and legally appropriate. Do not merely add a link and call the integration complete.

## AI Sale Automation
https://github.com/dj4550797-lab/Ai-Sale-Automation-

Use this repository only as a reference for understanding provider configuration, model selection, capability tagging, fallback design and connection testing.

**Do not copy source code from this repository.** Design and implement JARVIS's own code using the documented requirements.

## Apktool
https://github.com/iBotPeaches/Apktool

Optional Android package inspection tool for development diagnostics where relevant. It is not a substitute for a native Kotlin Android application.

## Official platform documentation
- Tauri capabilities and permissions: https://v2.tauri.app/security/capabilities/
- Tauri sidecar packaging: https://v2.tauri.app/develop/sidecar/
- Android Accessibility Service: https://developer.android.com/guide/topics/ui/accessibility/views/service
- Android Accessibility API distribution requirements: https://support.google.com/googleplay/android-developer/answer/10964491

Review current documentation and policy before implementation, especially for desktop permissions, Android accessibility usage, and packaged runtime dependencies.

---

# PART 18 — FINAL MASTER EXECUTION PROMPT

**Follow this prompt as the operating contract for the coding agent.**

You are building JARVIS according to this complete PRD.

Start by inspecting the repository. Do not delete existing user work. Read every requirement and identify the architecture, dependencies, risks and acceptance criteria.

Before implementing product features, create and validate the required Markdown documentation files, including `AGENTS.md`, `README.md`, `PRD.md`, `ARCHITECTURE.md`, `implement_plan.md`, `workflow.md`, `data.md`, `test.md`, `task.md`, `memory.md`, `SECURITY.md`, `PRIVACY.md`, and `CHANGELOG.md`.

Make the documentation accurate and consistent with the actual code and project state. Record decisions and uncertainties instead of inventing facts.

Design a real application using HTML5, CSS3, TypeScript, React and Tauri 2 for the Windows UI; Python and FastAPI for the shared backend; and Kotlin with Jetpack Compose for Android. Keep the architecture modular and use platform-specific adapters.

After planning, begin Phase 1 and proceed phase by phase. For every meaningful implementation, run the applicable tests, inspect the actual results, correct failures, update all affected documentation, update task and memory records, review the Git diff, and commit coherent changes.

Preserve a complete project history. Push documentation and verified source changes to the configured GitHub remote when authorized and authenticated. Never claim a remote push, build, test, deployment or integration succeeded without actual evidence.

Treat `/memory` as a recovery operation. Reconstruct the latest project state from `memory.md`, canonical documents, actual files, Git history and verified backups. Update project memory without destroying historical information. Use versioned snapshots and independent backups when configured.

Do not store secrets in Markdown or Git. Do not use memory as an excuse to duplicate private credentials or sensitive data.

Implement real behavior rather than decorative controls or fake demo responses. Use mocks only in isolated tests. Never display test fixtures as actual device, browser, provider or user data.

When a platform or external service prevents a requested action, display the accurate status and reason, retain diagnostic details with sensitive-data redaction, and provide a safe next step. Never bypass access controls or sensitive authorization.

Before marking any phase complete, verify the phase's acceptance criteria, run regression tests, update the required documentation, and record real evidence. If a test cannot be performed, state exactly what remains unverified.

Do not try to implement everything at once. Do not skip phases. Do not silently change the architecture. Do not overwrite data to make a test pass. Do not fabricate progress.

At every `/status` request, report:
1. Current phase.
2. Completed features with evidence.
3. Current task.
4. Tests run and their actual results.
5. Open failures.
6. Blockers and missing prerequisites.
7. Files/documentation changed.
8. Git commit and remote-push state.
9. Backup/memory state.
10. Exact next task.

The project is complete only when the required functionality, real integrations, security controls, recovery procedures, tests and release criteria have been verified and the remaining limitations are clearly documented.

**Begin with repository audit and planning, establish the canonical project memory and recovery process, and then implement Phase 1.**

# FINAL REQUIREMENT — SINGLE-FILE WINDOWS INSTALLER AND ANDROID APK

This requirement overrides any earlier wording that suggests the end user must manually assemble, build, or install application dependencies.

## 1. Windows deliverable

Produce a distributable `JARVIS-Setup.exe` installer.

Bundle the application frontend and all required redistributable runtime components using a verified packaging method. The end user must not be required to separately install Python, Node.js, or development tools just to run JARVIS.

Do not claim that every runtime or AI model is included unless the actual installer contents have been verified. Clearly document optional services and hardware requirements.

## 2. Android deliverable

Produce a single, installable Android APK named `JARVIS.apk`.

The final user-facing Android deliverable must be one APK file, not a collection of split APK files, an XAPK package, or an Android Studio project.

Bundle:
- The JARVIS Android application.
- The native application code.
- Required compatible runtime libraries.
- The production UI and application assets.
- Local database and migration support.
- The in-app task and memory client.
- Required app components and configuration defaults.
- All mandatory dependencies that can legally and technically be packaged.

The end user must not need Python, Node.js, Gradle, Android Studio, ADB, Termux, or a separate JARVIS backend installation merely to install and launch the APK.

Android's normal installation confirmation and runtime permission requests must remain intact. Do not attempt to bypass Android security.

## 3. Android architecture

Use Kotlin and Jetpack Compose for the Android application. Keep supported phone-side functionality inside the installed Android app wherever practical.

Do not make the Android app depend on a separately installed Python server. If a feature requires a shared remote service, configured AI provider, internet connection, or another device, implement the appropriate authenticated connection and display its actual availability.

Local application functions must work without a cloud connection wherever they are designed to do so. Features that genuinely depend on a remote model or service must clearly indicate when that dependency is unavailable.

Do not claim that all large AI models, unlimited computing resources, or every external service are bundled inside the APK. Optional model downloads must happen through an explicit in-app flow and must not be misrepresented as already included.

## 4. Single-APK build and verification

Configure the Android release build to generate one universal APK for the declared supported Android architectures, choosing the architecture coverage after validating native dependencies and compatibility.

The release process must:
1. Build the APK from the actual Android source.
2. Run unit tests and applicable integration tests.
3. Run Android lint and security checks.
4. Verify the APK file exists and is non-empty.
5. Inspect its application ID, version and supported architectures.
6. Verify its signature.
7. Install it on a supported Android device or emulator.
8. Launch it and complete the release smoke tests.
9. Verify first-launch permissions and onboarding.
10. Test upgrade behavior and preservation of user data.
11. Record the file size and SHA-256 checksum.
12. Publish the verified APK as a release artifact.

The expected release artifact must be clearly identified as `JARVIS.apk`. The actual output path may be configured in the build pipeline but must be reported accurately.

## 5. Signing and updates

Use a persistent, protected release-signing key. Never commit the signing key or its password to GitHub.

Build debug APKs for development tests and a separately signed release APK for distribution.

Ensure that future updates use compatible signing credentials and application identity. Document the recovery process for signing credentials because losing them may prevent seamless upgrades.

## 6. Final user experience

The user receives the single APK, copies it to their Android phone if necessary, opens it, accepts Android's installation prompt, and launches JARVIS.

There must be no requirement for the user to compile the source code or perform developer-only commands.

On first launch, JARVIS guides the user through configuration, optional AI provider setup and required OS permissions. It must show which features are available locally, which require internet access, and which require a configured external service.

The Windows EXE and Android APK must both be produced from their respective real release pipelines, tested, and verified before being labelled final.

Do not report a successful build or delivery until the artifact actually exists and the available verification steps have passed.

# MANDATORY ADDENDUM — LOCAL AI, OFFLINE MODE AND ZERO-API OPERATION

## 1. Core requirement

JARVIS must support two distinct operating modes:

1. **Local/Offline Mode:** The application uses local services, locally stored data and compatible on-device AI models without requiring an internet connection or paid cloud API.
2. **Online/Hybrid Mode:** The application may use configured cloud AI providers, web search, remote workers and synchronization services.

Local/Offline Mode is a mandatory product capability, not an optional future idea.

The application must not silently send private content to a cloud provider when Local/Offline Mode is active.

## 2. Windows local AI

The Windows installer must include the required application runtime and local inference integration code without requiring the end user to install Python, Node.js, or development tools.

Implement a modular local model engine that can support compatible local models, subject to hardware and licence compatibility. Evaluate an embeddable inference runtime such as llama.cpp/GGUF or another maintained, suitable runtime.

Provide:
- Local model discovery.
- Model installation/download from supported sources.
- Model file integrity checks.
- Hardware and memory compatibility checks.
- CPU inference where supported.
- GPU acceleration where supported.
- CPU fallback when available.
- Model loading/unloading.
- Context-size and memory settings.
- Local model status.
- Offline model selection.
- Inference logs and performance metrics.
- Model storage location configuration.
- Safe cancellation of model downloads and inference jobs.

Ollama integration may be offered as an additional provider adapter, but JARVIS must not require a separate Ollama installation if the product claims to provide a self-contained local inference option.

Do not claim GPU acceleration works until it has been tested on the supported hardware configuration.

## 3. Android on-device AI

The Android APK must support a local inference adapter for compatible Android devices.

Evaluate appropriate on-device runtimes, such as compatible MediaPipe/ML Kit on-device capabilities or a suitable native inference runtime, after validating current device support, licensing, performance, and Android compatibility.

Implement:
- Device capability detection.
- Available local model/runtime detection.
- Storage and RAM checks.
- Local model availability status.
- Model download where required and user-authorized.
- Model checksum/integrity verification.
- CPU/GPU/NPU acceleration only where supported.
- Low-memory failure handling.
- Model download cancellation.
- Inference cancellation.
- Offline capability reporting.

Use on-device system AI APIs only when the device and runtime actually support them. Do not assume that every Android phone has Gemini Nano or the same on-device AI functionality.

Do not require a separately installed Python backend, Termux, or development tools for the Android app to operate.

## 4. APK size and model storage

The distributable Android application must be one installable APK.

Bundle the JARVIS application, required native libraries and practical runtime dependencies in that APK. Large AI model weights must not be claimed as bundled unless they are actually inside the artifact.

Provide two supported options where practical:

- A reasonably sized base APK with an in-app model download manager.
- An optional offline model package or recovery bundle for compatible models.

If a model requires a separate download, explain that an internet connection is needed for the initial download. Once completely downloaded and validated, compatible local inference must work offline.

Allow the administrator to choose a model size based on available storage, memory and performance requirements.

## 5. Offline voice

Provide local voice components where practical:
- Local wake-word detection.
- Offline speech recognition.
- Local text-to-speech.
- Local audio activity indicators.

The application must detect and report which language packs and voice models are available offline.

If Hindi, English or Hinglish recognition depends on a model or platform component that is not available locally, show the limitation accurately rather than secretly using a cloud speech provider.

Allow voice features to fall back to text interaction when local audio processing is unavailable.

## 6. Offline features

The application should support the following locally whenever their required components and data are available:

- Launching the JARVIS application.
- Accessing stored preferences and local memory.
- Searching previously indexed local documents.
- Viewing project records and local task history.
- Running compatible on-device/local AI models.
- Processing supported local files.
- Managing local workflows.
- Reading local logs and diagnostics.
- Creating and verifying local backups.
- Running supported local automation.
- Displaying current local health status.

Actions that inherently require a remote server, live web content, cloud-only model, online synchronization or external account service must be marked as unavailable offline.

## 7. Strict cloud exclusion

When the administrator selects Local/Offline Mode:
- Route inference only to a verified local engine.
- Block cloud model fallback by default.
- Do not send prompts, files, memories or screen content to external model providers.
- Display the active inference backend.
- Log the routing decision without exposing sensitive content.
- Show a clear error when no compatible local model is available.
- Request explicit user authorization before changing to online/cloud execution.

A failed local model must never trigger an invisible cloud fallback.

## 8. Local memory and data storage

Store personal memory and local task records on the user's device by default.

Provide:
- Persistent local database.
- Database migrations.
- Local full-text search.
- Optional local vector search.
- User-configurable data directories where supported.
- Backup and restore.
- Encrypted storage for supported sensitive data.
- User-controlled export and deletion.

Local memory must remain available after a normal app restart and must not depend on cloud conversation history.

## 9. Local model manager UI

Add a page named **Local Models**.

It must display:
- Model name and identifier.
- Runtime and version.
- Downloaded/not downloaded status.
- Model size.
- Required storage.
- Estimated memory requirements when reliable data is available.
- Supported capabilities.
- Compatibility status.
- CPU/GPU acceleration status.
- Current loaded model.
- Download/install progress based on actual transfer state.
- Last successful load.
- Actual model errors.
- Delete/unload controls.
- Model integrity status.

Do not display hard-coded model availability or invented download progress.

## 10. Offline acceptance tests

The release pipeline must include actual offline-mode verification.

Required checks:
1. Install JARVIS and configure a compatible local model.
2. Verify that the model loads successfully.
3. Disconnect internet access.
4. Restart the application.
5. Verify supported local conversation/inference.
6. Verify local memory retrieval.
7. Verify local file search and eligible processing.
8. Verify the application blocks cloud fallback.
9. Verify that online-only features display an accurate unavailable status.
10. Reconnect and confirm the app resumes eligible online services without corrupting tasks or memory.
11. Inspect logs to confirm no cloud inference request occurred during enforced offline mode.
12. Document the actual hardware, model, OS and test results.

Run equivalent Android tests on supported physical hardware where available. If a phone does not support the selected local runtime or lacks sufficient resources, clearly report the limitation and test another supported configuration.

## 11. Hardware and performance policy

Never promise identical AI speed or model quality across all devices.

Before downloading or loading a model, check available storage and memory where the OS allows. Provide warnings, cancellation and recoverable error handling.

Offer model profiles such as:
- Small/low-resource.
- Balanced.
- Larger/capability-focused.

Select actual model files only after validating their licensing, requirements, supported runtime and resource consumption.

## 12. Definition of done

The local AI feature is complete only when actual inference has been demonstrated offline on a supported Windows configuration and a supported Android configuration.

A functioning UI, a downloaded model file or a passing unit test is not sufficient evidence of end-to-end offline AI.

Report separately:
- Local application startup.
- Local inference.
- Offline voice.
- Local memory and file processing.
- Local automation.
- Cloud-dependent features.
- Unsupported devices and capabilities.

Do not claim complete offline operation until the relevant acceptance tests pass.
