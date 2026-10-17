JARVIS — Master Product Requirements Document (PRD)

Version: 1.0
Product: JARVIS Personal AI Assistant
Initial Platform: Windows Desktop
Primary Developer/Builder: Google Antigravity
Deployment Goal: Installable Windows application (".exe" installer)
Product Type: Private, local-first personal AI assistant
Status: Planning and phased implementation

---

1. Product Vision

JARVIS is a personal AI assistant designed to communicate naturally, remember relevant information, help with computer tasks, assist with coding, research information, work with voice and supported visual inputs, and eventually coordinate specialized AI agents.

The first release must be a stable Windows desktop application. Future releases may add web, Android, iOS, smart glasses, and other interfaces without requiring a complete rewrite of the core assistant.

JARVIS is a private personal application. It is not intended for public distribution as an online assistant service.

1.1 Primary objectives

1. Provide a usable Windows desktop application.
2. Support local AI models for basic usage without requiring a paid API.
3. Allow optional external AI providers through configurable adapters.
4. Support natural conversation, streaming responses, voice input/output, and persistent memory.
5. Provide a clear dashboard for devices, permissions, settings, tasks, logs, and diagnostics.
6. Support controlled computer operations using explicitly registered tools.
7. Help with coding, research, content production, and repetitive workflows.
8. Recover gracefully from failures and explain errors.
9. Produce a verified Windows installer and document the installation process.
10. Keep the architecture extensible for future platforms and AI agents.

1.2 Non-goals for the first release

The first release will not attempt to:

- Train a frontier-scale language model from scratch.
- Guarantee that every answer is correct.
- Guarantee a complete answer within 0.1 seconds.
- Bypass Windows security or application permissions.
- Run local tasks when the computer is powered off.
- Automatically control every third-party application without a supported integration.
- Guarantee that every external website or creative tool can be fully automated.
- Modify its own source code without review, testing, and recovery controls.
- Publish content or send external communications without an applicable authorization policy.

---

2. Target User and Operating Environment

2.1 Target user

One primary user operating JARVIS on a personal Windows computer.

2.2 Initial platform

- Windows 10/11, with the exact supported versions verified during Phase 0.
- Desktop application that can be launched from a shortcut.
- Keyboard and mouse interface.
- Optional microphone, speakers/headphones, webcam, and screen-capture functionality.
- Internet connection required for online services; basic local functionality should remain available offline where supported.
- Local AI inference depends on the available hardware and installed model.

2.3 Hardware detection

At first launch, JARVIS should detect and display:

- Operating system and version.
- CPU architecture and logical processor count.
- Available RAM.
- Available disk space.
- GPU information when a supported detection method is available.
- GPU memory when detectable.
- Microphone and speaker availability.
- Camera availability.
- Local model runtime availability.
- Network availability.
- Installed application version.

Hardware detection must be best-effort. A failed GPU or device query must not crash the application.

The assistant must not claim that a model can run efficiently until model requirements have been checked against the detected hardware.

---

3. Core Product Principles

3.1 Local-first

Prefer local storage, local inference, and local processing when practical. External providers are optional integrations.

Do not transmit conversations, files, screen contents, camera frames, or credentials to external services unless the user enables a feature that requires it and the data flow is disclosed.

3.2 Honest status

The UI must distinguish:

- Available
- Unavailable
- Permission required
- Not configured
- Connecting
- Running
- Failed
- Not tested
- Partially supported

Never display a fake success status.

3.3 Explicit capabilities

Every device or computer-control feature must have a capability entry and a clear enabled/disabled status.

Do not silently bypass OS permissions. Windows permission dialogs and restrictions remain authoritative.

3.4 Recoverability

Important operations should be logged. Failures should have actionable explanations. Updates and code changes should be reversible where possible.

3.5 Replaceable integrations

AI providers, speech engines, model runtimes, databases, and external integrations must be behind interfaces so they can be replaced without rewriting the entire application.

---

4. Recommended Technology Stack

The agent must verify current compatibility, installation requirements, licences, and packaging constraints before implementation. If a dependency is incompatible, document the evidence and propose a replacement before changing the architecture.

4.1 Desktop application

Tauri 2

Responsibilities:

- Windows desktop shell.
- Native window management.
- Application packaging.
- Controlled access to desktop capabilities.
- Communication with the local backend.

Use the narrowest required Tauri permissions. Do not enable unrestricted shell or filesystem access for convenience.

4.2 Frontend

- React
- TypeScript with strict mode
- Vite
- Material Design 3-inspired UI
- Accessible components and keyboard navigation
- Vitest and React Testing Library
- ESLint and TypeScript checks

Use a consistent design system with reusable buttons, dialogs, cards, forms, status indicators, and loading/error states.

4.3 Backend

- Python 3.12+ or another version verified as compatible with all selected dependencies.
- FastAPI
- Uvicorn during development.
- Pydantic and Pydantic Settings.
- SQLAlchemy 2.x.
- Alembic migrations.
- SQLite for the initial local database.
- Pytest for backend testing.

The final packaged Python version must be explicitly pinned and verified.

4.4 Local AI

Implement a provider adapter interface.

Initial integration candidate: Ollama, subject to verification of its Windows support, installation requirements, API behaviour, and model compatibility.

Requirements:

- Detect whether the runtime is installed and reachable.
- List available models when the runtime supports it.
- Allow model selection.
- Stream output when supported.
- Apply connection and generation timeouts.
- Show understandable errors if a model is unavailable.
- Never download large models silently.
- Display model download size or a best-effort estimate before installation.
- Do not assume every model supports image, audio, or tool-calling features.

4.5 Optional cloud providers

Design replaceable adapters for compatible providers, including OpenAI-compatible APIs and other providers supported by their official interfaces.

Requirements:

- The app must not require a cloud API key for all basic functionality.
- API keys must never be embedded in source code.
- Use an OS-backed credential store where practical.
- If encrypted local configuration is used, protect the encryption key separately.
- Redact secrets from logs and error reports.
- Provider failures must not crash the application.
- Do not claim compatibility with a provider until a real test succeeds.

4.6 Speech and audio

Create interfaces for:

- Speech-to-text (STT).
- Text-to-speech (TTS).
- Microphone input.
- Audio output.
- Optional wake-word detection.

Prefer local speech engines where hardware, licensing, and quality permit. Choose concrete libraries only after verifying Windows compatibility, model requirements, and licences.

4.7 Database

SQLite with SQLAlchemy and Alembic.

Store the database under the user's stable application-data directory, not inside a temporary build directory.

Requirements:

- Versioned migrations.
- Database backup and restore.
- Safe first-run initialization.
- Graceful handling of locked or corrupted databases.
- No automatic deletion of user data during upgrades.
- Never run destructive migrations without a backup and an explicit migration plan.

4.8 Packaging

Target: Windows installer generated using the verified Tauri packaging toolchain.

The Python backend may be bundled as a sidecar using PyInstaller or another verified compatible approach.

The final packaging workflow must prove that:

1. The backend starts from the packaged application.
2. The frontend connects to the backend.
3. Database paths are writable.
4. Logs are created correctly.
5. Device diagnostics work.
6. The installer works on a clean test environment.
7. The installed app launches without the development environment.
8. The app can be uninstalled without unexpectedly deleting user data.

A successful development server is not proof that the Windows installer works.

---

5. System Architecture

Use separate layers with clear responsibilities.

5.1 High-level architecture

Windows Desktop Application
          |
          v
React + TypeScript UI
          |
          v
Tauri Desktop Bridge
          |
          v
Local Python API
          |
          v
JARVIS Core Orchestrator
   |       |        |
   v       v        v
 Memory   Tools   AI Router
   |       |        |
   v       v        v
SQLite   OS APIs  Local/Cloud Models

Speech, vision, research, coding, and workflow automation should be independent services or modules registered with the core orchestrator.

5.2 Core backend modules

- Conversation manager.
- AI provider router.
- Memory service.
- Tool registry.
- Permission/capability registry.
- Speech manager.
- Device diagnostics.
- Task manager.
- Notification manager.
- Research service.
- Coding assistant service.
- Audit logger.
- Configuration manager.
- Health-check service.

Avoid putting all functionality into one Python file or one oversized frontend component.

5.3 API security

If the local backend exposes HTTP endpoints:

- Bind to loopback by default.
- Do not expose the backend to the public internet.
- Use a protected session or random local token between the desktop shell and backend.
- Validate requests using Pydantic schemas.
- Restrict CORS to the exact required origin.
- Apply request-size limits and sensible timeouts.
- Never log authentication tokens.
- Do not trust arbitrary local webpage requests.
- Restrict file access to approved locations and capabilities.

The Tauri frontend must not be given unrestricted access to the operating system.

---

6. Suggested Project File Structure

The agent may adjust this structure only after documenting a concrete technical reason.

jarvis/
├── PRD.md
├── README.md
├── CHANGELOG.md
├── LICENSES.md
├── .gitignore
├── .editorconfig
├── .env.example
├── pyproject.toml
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   ├── INSTALLATION.md
│   ├── TROUBLESHOOTING.md
│   ├── TESTING.md
│   ├── RELEASE_CHECKLIST.md
│   └── decisions/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx
│   │   │   ├── routes.tsx
│   │   │   └── providers.tsx
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── chat/
│   │   │   ├── settings/
│   │   │   └── diagnostics/
│   │   ├── pages/
│   │   │   ├── ChatPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── DevicesPage.tsx
│   │   │   ├── MemoryPage.tsx
│   │   │   ├── ModelsPage.tsx
│   │   │   ├── TasksPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── LogsPage.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── events.ts
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── styles/
│   │   ├── utils/
│   │   └── main.tsx
│   └── tests/
│
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/
│   ├── icons/
│   └── src/
│       └── main.rs
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── health.py
│   │   │   ├── chat.py
│   │   │   ├── devices.py
│   │   │   ├── permissions.py
│   │   │   ├── models.py
│   │   │   ├── memory.py
│   │   │   ├── tasks.py
│   │   │   └── settings.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── lifecycle.py
│   │   │   ├── orchestrator.py
│   │   │   ├── events.py
│   │   │   └── exceptions.py
│   │   ├── ai/
│   │   │   ├── base.py
│   │   │   ├── router.py
│   │   │   ├── streaming.py
│   │   │   └── providers/
│   │   ├── memory/
│   │   │   ├── service.py
│   │   │   ├── extraction.py
│   │   │   └── retrieval.py
│   │   ├── tools/
│   │   │   ├── registry.py
│   │   │   ├── permissions.py
│   │   │   ├── filesystem.py
│   │   │   ├── applications.py
│   │   │   └── media.py
│   │   ├── devices/
│   │   │   ├── diagnostics.py
│   │   │   ├── microphone.py
│   │   │   ├── camera.py
│   │   │   └── screen_capture.py
│   │   ├── speech/
│   │   │   ├── stt.py
│   │   │   ├── tts.py
│   │   │   └── wake_word.py
│   │   ├── research/
│   │   ├── coding/
│   │   ├── workflows/
│   │   ├── notifications/
│   │   ├── database/
│   │   │   ├── models.py
│   │   │   ├── session.py
│   │   │   └── migrations/
│   │   ├── logging/
│   │   └── security/
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── security/
│
├── scripts/
│   ├── dev.ps1
│   ├── test.ps1
│   ├── build.ps1
│   └── clean.ps1
│
└── release/

Important: This is the target architecture, not a requirement to create every empty file on day one. Add modules when the corresponding phase needs them. Do not create hundreds of empty placeholder files to make the project appear complete.

---

7. User Interface Requirements

7.1 Design

Use a modern Material Design 3-inspired desktop interface.

Requirements:

- Clean typography.
- Consistent spacing and components.
- Light and dark themes.
- Responsive layout for different desktop window sizes.
- Keyboard navigation.
- Visible focus indicators.
- Accessible labels.
- Clear loading, empty, success, warning, and error states.
- No fake controls or decorative buttons that do nothing.

7.2 Main navigation

Provide the following areas, enabling features only when implemented and tested:

1. Chat
2. Dashboard
3. Devices & Permissions
4. AI Models
5. Memory
6. Tasks & Automations
7. Research & Projects
8. Coding Assistant
9. Notifications
10. Settings
11. Diagnostics & Logs

7.3 Chat interface

Include:

- Message history.
- User and assistant message distinction.
- Streaming responses where supported.
- Stop-generation control.
- Retry control.
- Copy response.
- Clear error display.
- Current model/provider indicator.
- Voice input button.
- Read-aloud control.
- New conversation.
- Optional conversation search.

A stopped or failed response must not be saved as a successfully completed response.

7.4 Dashboard

Display:

- Backend health.
- Selected AI provider/model.
- Local model runtime status.
- Microphone/camera status.
- Permission status.
- Current running tasks.
- Last errors.
- Disk and memory indicators when available.
- Feature availability.
- Diagnostic shortcuts.

Do not display false device or model status.

---

8. First-Run Setup and Diagnostics

The first launch must open a setup/diagnostics flow.

8.1 Checks

Run checks for:

- Supported Windows version.
- Required application files.
- Backend startup.
- Database creation and read/write access.
- Required folders.
- AI runtime availability.
- Available model configuration.
- Microphone availability.
- Audio output availability.
- Camera availability.
- Screen-capture capability.
- Network connectivity, where relevant.
- Required OS permissions.
- Writable log location.

8.2 Results

Every check must show:

- Check name.
- Status.
- Short explanation.
- Fix instructions when possible.
- Retry action when appropriate.

Use statuses such as "PASS", "WARNING", "BLOCKED", "FAIL", and "NOT_TESTED".

A missing camera must not block text chat. A missing local model must not prevent opening settings or diagnostics.

8.3 Permissions

The application may request permissions only when the relevant capability is being configured or used.

Important limitations:

- Windows can show OS-managed permission dialogs.
- Some permissions must be enabled in Windows Settings.
- Application code cannot silently grant all permissions.
- A webcam may be detected but inaccessible.
- Screen capture may require a supported API and an active user session.
- A device check must not be reported as a successful real recording unless a safe test was actually performed.

8.4 Device controls

Provide individual toggles for:

- Microphone use.
- Voice activation.
- Camera use.
- Screen capture.
- Notifications.
- Background operation.
- Proactive conversation.
- Optional online processing.

The user must be able to disable each capability. The application must clearly indicate when microphone or camera capture is active.

---

9. Conversation and Personality

JARVIS should communicate naturally rather than sounding like a rigid command parser.

Requirements:

- Maintain conversational context.
- Explain technical subjects clearly.
- Adapt response length to the request.
- Support a configurable assistant name and personality.
- Allow humour and light roasting when appropriate.
- Use a serious and supportive tone in sensitive or serious situations.
- Avoid repeatedly asking for information already available in the current context.
- Ask clarifying questions when missing information materially affects an action.
- Admit uncertainty and distinguish verified facts from assumptions.

9.1 Language

Provide language settings for:

- Conversation language.
- Voice output language.
- Speech recognition language.
- Automatic language detection when supported.

Do not hard-code one language into the entire application. Exact default language preferences can be finalized in Settings.

9.2 Low latency

Use:

- Streaming generation.
- Asynchronous I/O for network and long-running operations.
- Background execution for independent tasks.
- Cancellation support.
- Timeouts.
- Caching only where correctness and privacy permit.

Do not promise 100 ms end-to-end answers. Response time depends on the selected model, hardware, network, and task complexity.

---

10. AI Provider Router

Implement a common provider interface.

Example conceptual interface:

generate(messages, model, settings)
stream(messages, model, settings)
health_check()
list_models()
supports(feature)

The actual implementation must use typed schemas and provider-specific adapters.

10.1 Routing behaviour

The router should:

- Use the user's selected provider by default.
- Detect unavailable providers.
- Apply configurable timeouts.
- Support cancellation.
- Record provider failures.
- Optionally use a configured fallback.
- Report which provider actually answered.

Do not silently send private content to a different external provider as a fallback.

10.2 Capability checking

Track support for:

- Text.
- Images.
- Audio.
- Tool calling.
- Streaming.
- Structured output.
- Context-window limitations.

Do not send unsupported input to a model and pretend the model processed it.

10.3 Offline behaviour

When the network is unavailable:

- Continue local features that do not need the network.
- Use a local model if installed and compatible.
- Explain which features are unavailable.
- Never display a fabricated AI response as a real model result.

---

11. Persistent Memory

Memory must be useful, transparent, editable, and deletable.

11.1 Memory types

Separate:

- Explicit user facts.
- User preferences.
- Active project context.
- Temporary conversation context.
- User-approved reminders.
- Inferred preferences, marked as uncertain.
- Retrieved documents and references.

Do not treat a guess as a confirmed user fact.

11.2 Memory operations

Support:

- Save a relevant memory.
- View saved memories.
- Search memory.
- Edit a memory.
- Delete an individual memory.
- Clear all user memory after explicit confirmation.
- Export memory.
- Disable automatic memory creation.
- Show when a memory influenced a response where practical.

11.3 Privacy

- Store memory locally by default.
- Do not save passwords, API keys, tokens, or other authentication secrets as ordinary memories.
- Avoid saving sensitive information unless there is a legitimate, explicitly requested need.
- Provide database backup and restore.
- Keep memory operations auditable.

11.4 Future retrieval

Add document retrieval and embeddings in a later phase. Choose the embedding model and vector index only after testing resource usage, licensing, and retrieval quality.

Do not describe storing conversation history as model training.

---

12. Voice and Audio

12.1 Speech input

Requirements:

- Select microphone.
- Check device availability.
- Start/stop recording.
- Display recording state.
- Convert audio to text through a configured STT engine.
- Show transcription before execution for sensitive commands.
- Handle silence, device disconnection, and recognition failures.

12.2 Speech output

Requirements:

- Read assistant responses aloud.
- Stop playback.
- Pause/resume where supported.
- Select voice and language.
- Adjust speech speed.
- Handle unavailable voices.

12.3 Wake word

Wake-word support is optional until a suitable local implementation has been selected and tested.

It must have:

- An explicit enable/disable setting.
- A visible indicator.
- Configurable quiet hours.
- A documented microphone data policy.
- A reliable shutdown control.

Do not record continuously to disk by default.

---

13. Computer Control and Tool Permissions

Computer operations must use registered, typed tools instead of unrestricted execution.

13.1 Initial capabilities

Potential tools include:

- Open an approved application.
- Open a user-approved folder.
- Search files in approved locations.
- Read supported text documents.
- Create a file in an approved workspace.
- Play/pause media where supported.
- Adjust supported application settings.
- Open a web page through an approved mechanism.
- Take a user-requested screenshot using a supported API.
- Inspect an approved project directory.

Every tool must declare:

- Tool name.
- Input schema.
- Required capability.
- Allowed locations or targets.
- Risk classification.
- Timeout.
- Audit-log behaviour.
- Expected result schema.
- Error behaviour.

13.2 Authorization model

Provide user-configurable permission profiles.

Routine actions: May run automatically after the user explicitly enables that capability.

Sensitive actions: Require confirmation or a specifically configured, narrow authorization policy.

Sensitive examples:

- Sending a message to another person.
- Publishing public content.
- Deleting important files.
- Installing software.
- Modifying security settings.
- Executing commands with elevated privileges.
- Transmitting private data to an external service.

Never implement a blanket unrestricted permission that gives an AI model uncontrolled access to the entire computer.

13.3 Filesystem safety

- Restrict operations to approved directories by default.
- Resolve paths and prevent path traversal.
- Prevent accidental writes outside the permitted workspace.
- Confirm destructive operations.
- Prefer moving files to a recoverable location over permanent deletion.
- Never silently overwrite an important file.
- Record changes and provide recovery guidance where possible.

13.4 Command execution

Do not expose a raw, unrestricted terminal to the model.

If command execution is implemented:

- Use an explicit command policy.
- Validate arguments.
- Use a dedicated working directory.
- Apply timeouts.
- Limit output size.
- Avoid administrator privileges by default.
- Never execute commands extracted directly from an untrusted webpage or document.
- Require approval for high-risk commands.
- Capture exit code and stderr.
- Terminate runaway processes safely.

---

14. Camera, Vision, and Screen Understanding

Vision must be implemented as a separately controlled capability.

14.1 Camera

- Show available camera devices.
- Allow explicit device selection.
- Provide preview only after user activation.
- Show a visible active state.
- Stop capture when disabled or when the task ends.
- Handle permission denial and camera contention.

14.2 Screen capture

- Use a supported Windows/Tauri-compatible capture mechanism.
- Make capture visible to the user.
- Capture only for an active request or a separately enabled workflow.
- Restrict saved screenshots to an approved directory.
- Do not upload screen contents to a cloud model without an enabled online-processing policy.

14.3 Image understanding

Send images only to a model that supports image input.

For local models, verify the actual model capability and resource requirements.

Never claim that JARVIS can see the screen or camera if the relevant integration is not working.

---

15. Notifications and Proactive Assistant

15.1 Notifications

Provide:

- Enable/disable notifications.
- Quiet hours.
- Do-not-disturb mode.
- Notification categories.
- Adjustable frequency.
- Priority rules.
- A notification history where useful.

15.2 Proactive conversation

The assistant may initiate a conversation only under a configured policy.

Examples:

- A task finished.
- A scheduled reminder is due.
- A user-requested monitoring condition triggered.
- A previously authorized workflow failed and requires attention.

Do not repeatedly interrupt the user. Respect quiet hours and DND.

15.3 VIP contacts

A future version may support user-designated VIP contacts for notification prioritization.

Do not obtain private contact data without permission. Any integration with contacts or messaging must use a documented and supported interface.

---

16. Task Manager and Long-Running Jobs

Use a task manager for operations that take more than a short interaction.

Each task should have:

- Task ID.
- Name and description.
- Created/started/finished timestamps.
- Status.
- Progress when measurable.
- Cancellation support.
- Log reference.
- Output files or result references.
- Error information.
- Retry policy where safe.

Possible statuses:

"QUEUED", "RUNNING", "WAITING_FOR_USER", "SUCCEEDED", "FAILED", "CANCELLED".

Do not mark a task successful merely because a subprocess started.

16.1 Background execution

The desktop application may continue tasks while minimized if the process and required services remain running.

If the application is closed, tasks may stop unless a supported background service is implemented.

If the computer sleeps, loses power, or shuts down, local processing cannot continue normally. Explain this limitation in the UI.

16.2 Recovery

- Record interrupted tasks.
- Identify incomplete operations on restart.
- Resume only when the operation is safe and its state can be verified.
- Do not blindly repeat external actions that may already have occurred.

---

17. Coding Assistant

The coding assistant should help inspect, diagnose, modify, and test user-approved software projects.

17.1 Required capabilities

- Open an approved project directory.
- Inspect file structure.
- Read source code.
- Search for symbols and errors.
- Explain stack traces.
- Propose fixes.
- Make isolated edits.
- Run approved tests and checks.
- Show a diff before applying or accepting significant changes.
- Maintain a change log.
- Restore a previous version when possible.

17.2 Safety rules

- Never silently replace the entire project to fix a small error.
- Never overwrite unrelated files.
- Never delete Git history.
- Never commit or push without the applicable authorization.
- Never claim a test passed without running it.
- Never claim a deployment succeeded without verifying it.
- Use a branch or worktree for substantial modifications.
- Keep secrets out of prompts and logs.
- Do not run arbitrary downloaded code automatically.
- Stop and report if a requested change conflicts with existing project requirements.

17.3 Self-repair

The application may detect a failed component and attempt a bounded recovery.

Examples:

- Restart a failed internal service.
- Reconnect to a local model runtime.
- Reinitialize a recoverable connection.
- Provide a suggested fix for a configuration problem.

It must not rewrite its own security rules or disable safety controls to make an error disappear.

---

18. Research and Content Production

This is a later-phase workflow system.

18.1 Research workflow

Potential stages:

1. Receive the user's topic.
2. Clarify scope and output format.
3. Search permitted sources.
4. Collect source URLs and relevant evidence.
5. Separate verified facts from uncertain claims.
6. Produce a structured outline.
7. Generate a draft.
8. Check factual claims and source support.
9. Save the output.
10. Report limitations and completion status.

Do not fabricate citations or pretend that a source was read when it was not accessed.

18.2 Video/documentary workflow

Potential stages:

1. Topic research.
2. Script and narration.
3. Scene breakdown.
4. Character and visual prompt preparation.
5. Asset generation through supported services.
6. Asset organization.
7. Video assembly using a supported editor or rendering library.
8. Audio integration.
9. Export and validation.
10. Title, description, and thumbnail preparation.
11. Optional upload through an authorized platform integration.

18.3 External tool limitations

Google Flow and other creative services may not expose a supported automation API for every action.

The agent must inspect current official interfaces and verify capabilities before implementation. Do not invent an API, bypass access controls, or assume UI automation will remain stable.

If a stage cannot be automated reliably, provide the exact required user action and preserve completed work.

18.4 Publishing

Uploading or publishing content is an external side effect.

Require explicit approval unless the user has configured a specific, narrow publishing policy. Verify the resulting URL or status before reporting success.

---

19. BGMI Audio Analysis and Gaming Assistance

This is an optional future feature.

Potential assistance:

- Analyze a user-provided or permitted audio sample.
- Identify likely footsteps or other audible events.
- Estimate left/right direction when the audio supports it.
- Explain uncertainty.
- Provide sensitivity-setting suggestions based on user observations and device configuration.

Requirements:

- Do not promise perfect direction detection.
- Explain that audio quality, headphones, mixing, and game settings affect results.
- Do not modify game memory or bypass anti-cheat.
- Do not implement cheating, automated aiming, or unauthorized game manipulation.

---

20. Multi-Agent Architecture

Multi-agent orchestration is a future capability.

Possible specialized agents:

- Research Agent.
- Coding Agent.
- File Assistant.
- Content Production Agent.
- Task Planning Agent.
- Diagnostics Agent.

Agents may share the same model while using different system instructions and tool permissions.

Requirements:

- A central orchestrator owns task state.
- Each agent has a defined scope.
- Each tool has its own capability policy.
- Agents cannot grant themselves additional permissions.
- Agent-to-agent messages are structured and traceable.
- Loops and runaway task spawning are prevented.
- Tasks have deadlines, cancellation, and resource limits.
- External side effects follow the same authorization policy as direct user requests.

Do not build several independent agents before the single-agent foundation is reliable.

---

21. Self-Learning and Knowledge Improvement

The product must distinguish four separate concepts:

1. Memory: Saving useful user-approved facts and preferences.
2. Retrieval: Finding relevant information from saved documents or knowledge sources.
3. Skills/workflows: Reusing tested procedures for recurring tasks.
4. Model training: Changing model parameters through fine-tuning or training.

The initial implementation should focus on memory, retrieval, and reusable workflows.

Do not claim that the model is training itself merely because conversation history is saved.

Any future training feature must define data selection, consent, resource requirements, validation, versioning, rollback, and privacy safeguards.

---

22. Database Model Requirements

Use SQLAlchemy models with explicit relationships and migrations.

Initial logical entities:

22.1 Conversation

- ID.
- Title.
- Created timestamp.
- Updated timestamp.
- Optional archive status.

22.2 Message

- ID.
- Conversation ID.
- Role.
- Content.
- Created timestamp.
- Provider/model metadata when relevant.
- Completion status.

22.3 Memory

- ID.
- Memory type.
- Content.
- Confidence or certainty label where applicable.
- Source type.
- Created/updated timestamps.
- Optional expiration.
- User-editable status.

22.4 Provider configuration

- ID.
- Provider name.
- Model name.
- Non-secret settings.
- Enabled state.
- Capability metadata.

Credentials must not be stored as ordinary plaintext fields. Use an OS credential store or a properly designed encrypted credential mechanism.

22.5 Task

- ID.
- Type.
- Status.
- Progress.
- Input reference.
- Result reference.
- Error summary.
- Created/started/completed timestamps.

22.6 Audit event

- ID.
- Event type.
- Capability/tool name.
- Outcome.
- Timestamp.
- Non-sensitive metadata.

Never put passwords, API keys, raw authentication tokens, or unnecessary private message content into audit logs.

---

23. Logging and Diagnostics

Centralized logs are mandatory.

23.1 Log levels

- DEBUG
- INFO
- WARNING
- ERROR
- CRITICAL

Default production logging should be INFO, with DEBUG enabled only when explicitly requested.

23.2 Log requirements

Record:

- Application startup/shutdown.
- Backend startup/shutdown.
- Provider connection failures.
- Device diagnostic failures.
- Task status changes.
- Tool execution outcomes.
- Database migration errors.
- Packaging/runtime errors.

Use timestamps, log levels, and component names.

23.3 Privacy

- Redact credentials.
- Avoid logging full private conversations by default.
- Avoid saving camera frames or microphone recordings unless explicitly requested by an enabled feature.
- Provide a clear way to open the log directory.
- Rotate logs to prevent unbounded disk growth.
- Provide a safe diagnostic bundle that excludes secrets.

23.4 Error messages

A user-facing error should explain:

- What failed.
- Which component failed.
- Whether the failure is recoverable.
- What the user can try.
- Where the relevant logs are stored.

The UI must not expose raw stack traces by default, but developers must have access to detailed logs.

---

24. Security and Privacy Requirements

Security must be designed into the application from the beginning.

- Use least privilege.
- Validate all external and user-supplied inputs.
- Keep secrets out of source control.
- Include ".env.example" only with placeholders.
- Never include real API keys in test fixtures.
- Protect local API endpoints.
- Restrict filesystem access.
- Apply tool-specific permissions.
- Record important actions.
- Confirm high-impact operations.
- Support stopping active tasks.
- Avoid unsafe deserialization.
- Treat webpages, documents, and model-generated text as untrusted input.
- Defend against prompt injection.
- Do not allow retrieved content to override system permissions.
- Do not let a model decide that it has permission to access a resource.
- Do not automatically execute instructions embedded in an untrusted document.
- Do not disable antivirus or Windows security controls.
- Do not bypass OS permission dialogs.

Prompt injection protections are not perfect. Use technical capability boundaries; do not rely on prompting alone for security.

---

25. Testing Strategy

Testing is a release requirement, not an optional cleanup step.

25.1 Backend tests

Test:

- Configuration loading.
- Input validation.
- API response schemas.
- Database initialization.
- Database migrations.
- Memory create/read/update/delete.
- Provider failures.
- Provider timeouts.
- Task cancellation.
- Tool permission enforcement.
- Filesystem path restrictions.
- Error handling.
- Secret redaction.

25.2 Frontend tests

Test:

- Chat rendering.
- Loading states.
- Error states.
- Settings persistence.
- Model selection.
- Permission status display.
- Diagnostics display.
- Task status display.
- Keyboard navigation for important controls.

25.3 Integration tests

Test:

- Frontend-to-backend communication.
- Backend-to-database communication.
- Backend-to-local-model runtime when available.
- Backend shutdown and restart.
- Cancellation of long-running tasks.
- Error propagation.
- Local API protection.
- Installed application startup.

25.4 Security tests

Test:

- Path traversal attempts.
- Unauthorized tool calls.
- Invalid API requests.
- Missing/invalid local authentication.
- Secret leakage in logs.
- Unsafe command attempts.
- Prompt-injection attempts against tool permissions.

25.5 Build verification

The agent must actually run available checks and report their results.

Minimum checks, adapted to the verified toolchain:

- Python syntax/import checks.
- Pytest.
- TypeScript type checking.
- Frontend lint.
- Frontend tests.
- Production frontend build.
- Tauri development launch.
- Packaged installer build.
- Installed application smoke test.

If a check cannot be run because a tool, device, model, or platform is unavailable, mark it "BLOCKED" or "NOT TESTED". Never report it as passed.

---

26. Build and Packaging Requirements

The release process must produce an actual installable Windows artifact.

26.1 Development mode

Provide documented commands for:

- Installing dependencies.
- Starting the backend.
- Starting the frontend.
- Running tests.
- Launching the desktop shell.

Use PowerShell scripts where practical.

26.2 Production mode

The packaged app must:

- Start its backend automatically.
- Use the correct stable application-data directory.
- Locate bundled assets correctly.
- Shut down child processes when appropriate.
- Handle an unavailable model runtime gracefully.
- Write logs to a predictable directory.
- Avoid depending on the developer's source directory.
- Avoid depending on an activated development virtual environment.

26.3 Release artifacts

The release folder should contain the actual verified artifacts, such as:

- Windows installer.
- Portable executable only if supported and tested.
- Version information.
- SHA-256 checksum.
- Release notes.
- Installation instructions.

Do not place a development script in the release folder and label it as the finished application.

26.4 Clean installation test

Test on a clean Windows environment or a separate test account/VM.

Verify:

- Installation.
- Launch.
- First-run diagnostics.
- Chat with an available model.
- Missing-model error behaviour.
- Database persistence after restart.
- Log creation.
- Uninstallation behaviour.

If clean-environment testing is impossible, explicitly document that limitation.

---

27. Error Prevention Rules for the Antigravity Agent

These rules apply throughout implementation.

1. Read this PRD before making changes.
2. Inspect the existing workspace before creating or replacing files.
3. Never assume the workspace is empty.
4. Preserve existing user files and configuration.
5. Do not replace working code without understanding its role.
6. Do not implement all phases in one enormous code dump.
7. Create a short implementation plan for each phase.
8. Identify dependency and version compatibility before installation.
9. Use stable, documented APIs.
10. Prefer small changes with focused tests.
11. Run relevant tests after every significant change.
12. Fix regressions before starting the next phase.
13. Do not swallow exceptions without logging.
14. Do not use broad exception handlers that turn failures into fake success.
15. Do not add buttons that have no working action.
16. Do not use mock data in production unless it is clearly labelled and intentionally enabled.
17. Keep demo/test providers separate from real providers.
18. Do not hard-code machine-specific paths.
19. Do not hard-code secrets.
20. Do not use temporary build directories for persistent data.
21. Use database migrations for schema changes.
22. Do not delete user data during upgrades.
23. Do not mark untested integrations as operational.
24. Do not invent external API endpoints.
25. Do not claim that an installer works until it has been built and tested.
26. Update documentation when commands, settings, or architecture change.
27. Maintain a list of known limitations.
28. Maintain a record of test results.
29. If blocked, explain the blocker instead of inventing a workaround.
30. Never weaken security or permission controls just to make a test pass.

27.1 Change procedure

For every phase:

1. Inspect relevant files.
2. Summarize the planned changes.
3. Identify affected components.
4. Implement the smallest coherent change.
5. Run focused tests.
6. Run broader regression tests.
7. Review logs and diffs.
8. Update documentation.
9. Report verified results and remaining limitations.

27.2 Completion report format

At the end of each phase, report:

- Implemented.
- Files created/changed.
- Commands executed.
- Tests passed.
- Tests failed.
- Tests blocked/not run.
- Known issues.
- Manual steps required.
- Next phase recommendation.

Never claim a test passed unless its result was observed.

---

28. Implementation Roadmap

Build in phases. Do not start Phase 2 until Phase 1's acceptance criteria pass.

Phase 0 — Workspace Inspection and Technical Verification

Do not begin feature implementation in this phase.

Tasks:

1. Inspect the current repository and existing files.
2. Read this PRD.
3. Check installed versions of Python, Node.js, Rust, and required build tools.
4. Verify Tauri, React, FastAPI, and Python sidecar packaging compatibility.
5. Identify Windows-specific dependencies.
6. Identify licensing and distribution restrictions for candidate libraries.
7. Recommend exact pinned versions.
8. Identify unknowns and risks.
9. Propose the final implementation sequence.
10. Create "docs/ARCHITECTURE.md", "docs/TESTING.md", and an initial checklist only after inspecting existing documents.
11. Do not overwrite existing user files.
12. Do not generate a giant set of empty modules.
13. Present the plan and wait for user approval before Phase 1.

Acceptance criteria

- Existing workspace has been inspected.
- Stack compatibility findings are documented.
- Dependency and packaging risks are listed.
- Implementation plan is clear.
- No unrequested destructive changes have occurred.

Phase 1 — Minimal Working Desktop Foundation

Build the smallest real end-to-end application.

Requirements:

- Tauri desktop shell.
- React + TypeScript UI.
- FastAPI backend.
- Protected local communication.
- Stable application-data directory.
- SQLite initialization.
- Central logging.
- Health-check endpoint.
- Basic chat UI.
- Configurable AI adapter interface.
- A working local model integration if its runtime is available.
- Clear unavailable-model behaviour if it is not.
- Settings and diagnostics screen.
- Basic unit and integration tests.

Acceptance criteria

- App launches in development mode.
- Frontend reaches the backend.
- Health status is correct.
- Database survives restart.
- Errors appear clearly.
- No fake AI response is shown as a real response.
- Automated checks are run and results recorded.

Phase 2 — AI Routing and Conversation

Add:

- Provider configuration.
- Model selection.
- Streaming responses.
- Stop-generation.
- Retry.
- Conversation persistence.
- Timeouts.
- Provider health checks.
- Optional fallback routing with appropriate privacy controls.

Acceptance criteria

- Successful response from a verified configured provider.
- Correct error for an unavailable provider.
- Stop-generation works where supported.
- Conversations persist.
- No secrets appear in logs.

Phase 3 — Memory

Add:

- Memory database model.
- Memory service.
- Memory settings UI.
- View/edit/delete.
- Disable automatic memory.
- Export and clear operations with appropriate confirmation.
- Tests for memory privacy and data integrity.

Acceptance criteria

- Memory operations survive restart.
- Deleted memories are not returned by ordinary retrieval.
- Uncertain information is not presented as confirmed fact.
- Clear-memory operations behave as documented.

Phase 4 — Device Diagnostics and Voice

Add:

- Device detection.
- Permission status.
- Microphone input.
- Speech-to-text adapter.
- Text-to-speech adapter.
- Device selection.
- Camera/screen capture only through verified supported APIs.
- Visible activity indicators.

Acceptance criteria

- Missing devices do not crash the app.
- Permission denial is handled.
- Voice can be stopped.
- Capture state is visible.
- Unimplemented devices/features are marked unavailable.

Phase 5 — Controlled Computer Tools

Add:

- Tool registry.
- Capability registry.
- File search in approved locations.
- Approved application launch.
- Safe file operations.
- Task logging.
- Authorization controls.
- Emergency stop.

Acceptance criteria

- Unauthorized operations are blocked.
- Path traversal tests pass.
- Destructive actions have safeguards.
- Every completed tool action has a verifiable result.

Phase 6 — Notifications and Background Tasks

Add:

- Task manager.
- Progress reporting.
- Cancellation.
- Notifications.
- Quiet hours.
- DND.
- Restart recovery for safe tasks.

Acceptance criteria

- Failed tasks are not marked successful.
- Cancelled tasks stop when supported.
- Quiet hours are respected.
- Interrupted tasks are recovered safely.

Phase 7 — Coding and Research Assistance

Add:

- Approved project inspection.
- Code diagnostics.
- Diff-based edits.
- Test execution.
- Research with source tracking.
- Output export.
- Recovery instructions.

Acceptance criteria

- Changes remain within approved project locations.
- Relevant tests are actually executed.
- Unverified research claims are labelled.
- Failures are visible and recoverable.

Phase 8 — Content Production and Specialized Agents

Add only after the core application is stable:

- Script and scene planning.
- Supported image/video integrations.
- Media assembly.
- Optional publishing integrations.
- Specialized agents.
- Shared task orchestration.
- Resource limits and agent cancellation.

Acceptance criteria

- Each workflow stage has a verifiable output.
- External service limitations are documented.
- Failed stages do not cause false completion.
- Publishing and other external side effects follow authorization rules.

Phase 9 — Release and Windows Installer

Tasks:

1. Freeze release scope.
2. Run all applicable automated tests.
3. Build the production frontend.
4. Package the Python backend.
5. Build the Tauri installer.
6. Test the installer.
7. Test the installed application after restarting Windows.
8. Verify database persistence.
9. Verify logs and diagnostics.
10. Test graceful handling of missing optional dependencies.
11. Generate checksums.
12. Prepare installation and troubleshooting documentation.
13. Record untested scenarios and known limitations.

Acceptance criteria

- A real Windows installer exists.
- The installed app launches.
- Backend and frontend communicate correctly.
- Persistent storage works.
- Diagnostics and logs work.
- The build/test report is truthful and complete.

---

29. Future Platform Expansion

Do not build all platforms in the first milestone.

Design the backend and provider interfaces so that later clients can use the same core services where appropriate.

Potential future clients:

- Web interface.
- Android application.
- iOS application.
- Smart glasses or other supported wearable interfaces.

Future clients must have their own authentication, permissions, secure transport, and device-capability handling.

Do not expose the local Windows backend directly to the public internet as a shortcut for mobile connectivity.

---

30. Environment and Configuration

Create ".env.example" containing placeholders only.

Example configuration categories:

- Application environment.
- Backend host/port.
- Database location.
- Log level.
- Local model endpoint.
- Default model.
- Optional provider identifiers.
- Request timeouts.
- Feature flags.

Secrets must not be committed to Git.

Use a typed settings layer. Validate required values at startup and explain configuration errors clearly.

Never store a real credential in documentation, sample configuration, screenshots, test output, or Git history.

---

31. Documentation Requirements

Maintain these documents:

- "README.md": product overview and setup.
- "docs/ARCHITECTURE.md": components and data flow.
- "docs/SECURITY.md": permissions, secrets, threat model, and safety boundaries.
- "docs/INSTALLATION.md": installation and first launch.
- "docs/TROUBLESHOOTING.md": common errors and recovery.
- "docs/TESTING.md": test commands and results.
- "docs/RELEASE_CHECKLIST.md": release acceptance checklist.
- "CHANGELOG.md": notable changes.
- "LICENSES.md": third-party dependencies and licences.

Documentation must reflect the actual implementation. Do not document a future feature as currently available.

---

32. Definition of Done

A feature is complete only when:

- Its requirements are implemented.
- The UI communicates its actual status.
- Input validation exists.
- Errors are handled.
- Relevant tests pass.
- Relevant logs are available.
- Permissions are enforced.
- Documentation is updated.
- Known limitations are recorded.
- The feature does not regress previously working functionality.

A release is complete only when the actual packaged application has been built and the applicable installation and smoke tests have been run.

Important: Zero errors can never be guaranteed. The engineering objective is to detect errors early, prevent known failure modes, limit damage, recover safely, and accurately report anything that remains unverified.

---

33. Initial Instruction to Google Antigravity

Read the entire "PRD.md" before making any code changes.

For your first task, execute Phase 0 only.

Do the following:

1. Inspect the existing workspace, repository status, files, and current implementation.
2. Do not overwrite or delete existing work.
3. Verify the compatibility of the proposed stack and Windows packaging approach.
4. Identify exact dependency versions only after checking compatibility.
5. Identify technical risks, unresolved choices, and required tools.
6. Propose the implementation plan and acceptance criteria for Phase 1.
7. Identify anything that cannot be verified in the current environment.
8. Summarize the findings and wait for approval.

Do not start implementing all features. Do not create an installer yet. Do not claim that tests or compatibility checks passed unless you actually ran them and observed the results.

The priority is a reliable, testable foundation that can eventually become a real Windows installer—not a large codebase that only appears complete.