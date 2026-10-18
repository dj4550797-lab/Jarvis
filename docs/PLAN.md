JARVIS — Implementation Plan

Version: 1.0
Project: Personal AI Assistant
Target: Windows Desktop Application
Primary Builder: Google Antigravity
Requirements: Refer to "PRD.md"

---

1. Mission

Build JARVIS as a reliable, local-first personal AI assistant that can eventually be packaged as a Windows installer.

Follow a phased implementation process. Prioritize correctness, security, maintainability, and verified functionality over implementation speed.

The final goal is a working application, not merely a collection of source files.

2. Mandatory Rules

Before starting development:

- Read "PRD.md" completely.
- Inspect the existing repository and workspace.
- Check the current Git status.
- Preserve existing user code and files.
- Verify the installed development tools.
- Verify library compatibility and Windows packaging requirements.
- Identify missing dependencies and unresolved design decisions.

During development:

- Implement one phase at a time.
- Run relevant tests after each significant change.
- Fix regressions before continuing.
- Do not invent APIs, test results, or working features.
- Do not create fake functionality to make the UI look complete.
- Do not hard-code secrets or machine-specific paths.
- Do not silently remove existing functionality.
- Do not disable security controls to bypass errors.
- Keep documentation synchronized with the implementation.

If blocked, explain the cause and present a practical solution. Do not hide failures.

---

3. Phase Status Tracking

Maintain this file as development progresses.

Use these statuses:

- "NOT_STARTED"
- "IN_PROGRESS"
- "BLOCKED"
- "TESTING"
- "COMPLETED"
- "NEEDS_REWORK"

A phase can be marked "COMPLETED" only when its acceptance criteria have been verified.

Initial status:

Phase| Description| Status
0| Workspace inspection and technical verification| COMPLETED
1| Minimal working desktop foundation| COMPLETED
2| AI provider routing and conversation| COMPLETED
3| Persistent memory| COMPLETED
4| Device diagnostics and voice| COMPLETED
5| Controlled computer tools| COMPLETED
6| Notifications and background tasks| COMPLETED
7| Coding and research assistance| COMPLETED
8| Content production and specialized agents| NOT_STARTED
9| Windows installer and release verification| NOT_STARTED

Update the status only when supported by actual work and test results.

---

4. Phase 0 — Workspace Inspection

Priority: CRITICAL

Do not begin full application implementation.

Tasks

1. Read "PRD.md" and this "PLAN.md".
2. Inspect the repository, files, and existing architecture.
3. Check Git status and preserve uncommitted changes.
4. Check installed versions of Python, Node.js, Rust, and required build tools.
5. Verify Tauri desktop packaging compatibility.
6. Verify the Python backend packaging approach.
7. Check dependency support for the target Windows version.
8. Review licensing and distribution restrictions.
9. Identify security and packaging risks.
10. Recommend exact compatible dependency versions.
11. Create or update the architecture and testing documents without overwriting useful existing work.
12. Prepare the Phase 1 implementation checklist.

Deliverables

- Workspace inspection report.
- Proposed architecture.
- Verified or unresolved dependency compatibility.
- List of required development tools.
- Risk and blocker list.
- Phase 1 implementation plan.
- Recommended test strategy.

Acceptance criteria

- Existing project state is understood.
- No unrequested destructive changes have occurred.
- Important compatibility risks are documented.
- The next implementation phase is clearly defined.

STOP: Present the report and wait for the user's approval before starting Phase 1.

---

5. Phase 1 — Desktop Foundation

Objective

Build a minimal, real desktop application with a functioning frontend, backend, database, logging, and diagnostics.

Tasks

1. Initialize or adapt the verified project structure.
2. Configure the Tauri desktop shell.
3. Set up React, TypeScript, and Vite.
4. Set up the Python FastAPI backend.
5. Implement protected local frontend-to-backend communication.
6. Add application configuration and validation.
7. Initialize SQLite in a stable application-data directory.
8. Add SQLAlchemy and database migrations.
9. Implement centralized logging.
10. Add a health-check endpoint.
11. Build the basic chat screen.
12. Build the dashboard and diagnostics screen.
13. Display actual backend and database status.
14. Add loading, empty, and error states.
15. Write unit and integration tests.

Acceptance criteria

- Desktop application launches in development mode.
- Frontend can communicate with the backend.
- Health status reflects actual backend state.
- Database survives application restart.
- Errors are logged and displayed clearly.
- No fake AI response is presented as a real model response.
- Relevant automated checks pass.

---

6. Phase 2 — AI Providers and Chat

Objective

Make JARVIS communicate with a real configured AI model.

Tasks

1. Define a common AI provider interface.
2. Implement the initial local model adapter.
3. Detect the local runtime and configured models.
4. Add model selection in Settings.
5. Add optional cloud provider adapters.
6. Implement streaming responses where supported.
7. Add stop-generation and retry controls.
8. Persist conversations and messages.
9. Add provider timeouts and error handling.
10. Add optional fallback routing with privacy controls.
11. Test missing models, unavailable providers, and network failures.

Acceptance criteria

- At least one configured provider works in a real test.
- Provider failures produce clear errors.
- Streaming and cancellation work where supported.
- Conversation history persists.
- Secrets are not exposed in logs.
- Cloud fallback does not silently disclose private content.

---

7. Phase 3 — Persistent Memory

Objective

Allow JARVIS to retain useful context across sessions.

Tasks

1. Create the memory database model.
2. Implement memory creation and retrieval.
3. Add memory editing and deletion.
4. Add memory search.
5. Add settings to disable automatic memory.
6. Separate explicit facts from uncertain inferences.
7. Add export and clear-memory operations.
8. Prevent credentials from being stored as ordinary memories.
9. Write privacy and data-integrity tests.

Acceptance criteria

- Memory persists across restarts.
- The user can inspect and edit saved memories.
- Deleted memories are no longer returned by normal retrieval.
- Clearing memory follows the documented confirmation flow.
- The assistant does not present uncertain information as confirmed fact.

---

8. Phase 4 — Device Diagnostics and Voice

Objective

Add voice interaction and device-status reporting.

Tasks

1. Detect microphone and audio-output availability.
2. Add device and permission status screens.
3. Implement the selected speech-to-text adapter.
4. Implement the selected text-to-speech adapter.
5. Add voice recording and playback controls.
6. Add device selection where supported.
7. Add visible recording and playback indicators.
8. Add camera diagnostics.
9. Add screen-capture diagnostics.
10. Implement camera or screen capture only through verified, supported APIs.
11. Handle denied permissions and disconnected devices.

Acceptance criteria

- Device checks do not crash the application.
- Missing devices produce clear status messages.
- Voice capture can be stopped.
- Recording/capture activity is visible.
- Unsupported features are labelled unavailable.
- Relevant privacy and permission tests pass.

---

9. Phase 5 — Controlled Computer Operations

Objective

Allow JARVIS to perform approved actions on the user's computer.

Tasks

1. Implement the tool registry.
2. Implement the capability and permission registry.
3. Add approved application launching.
4. Add file search in approved directories.
5. Add safe file reading and writing.
6. Add action logs.
7. Add authorization policies for sensitive operations.
8. Add task timeouts and cancellation.
9. Add an emergency stop.
10. Test path traversal and unauthorized operations.

Acceptance criteria

- Every tool has a defined input schema and permission policy.
- Unauthorized operations are blocked.
- File operations remain within permitted locations.
- Destructive actions have safeguards.
- Completed actions report verifiable results.
- No unrestricted terminal or filesystem access is given to the model.

---

10. Phase 6 — Notifications and Background Tasks

Objective

Allow JARVIS to manage longer tasks without blocking the chat interface.

Tasks

1. Create the task manager.
2. Add task statuses and timestamps.
3. Add progress reporting when measurable.
4. Add cancellation.
5. Add task history.
6. Add desktop notifications.
7. Add quiet hours and Do Not Disturb.
8. Add user-configurable proactive notifications.
9. Implement safe recovery of interrupted tasks.

Acceptance criteria

- Task statuses reflect actual execution.
- Failed tasks are not marked successful.
- Cancellation works where supported.
- Quiet hours and DND are respected.
- Interrupted tasks are not blindly repeated if they may have already caused external side effects.

---

11. Phase 7 — Coding and Research

Objective

Provide controlled coding and evidence-based research assistance.

Coding tasks

1. Inspect user-approved project directories.
2. Search source code and diagnose errors.
3. Explain stack traces.
4. Propose focused code changes.
5. Show diffs for significant modifications.
6. Run approved tests.
7. Keep a record of modified files.
8. Provide recovery instructions.

Research tasks

1. Collect information from permitted sources.
2. Save source references.
3. Separate verified facts from uncertain claims.
4. Generate structured reports and drafts.
5. Export completed outputs.
6. Report inaccessible sources and unresolved claims.

Acceptance criteria

- Project changes remain within approved locations.
- Tests are actually run before being reported as passed.
- Research references are genuine and traceable.
- Failed operations are reported honestly.
- Existing user work is preserved.

---

12. Phase 8 — Content Production and Multi-Agent System

Objective

Introduce advanced workflows only after the core application is stable.

Potential features

- Script generation.
- Scene breakdowns.
- Visual prompt preparation.
- Supported image/video generation integrations.
- Media assembly.
- Audio integration.
- Export validation.
- Optional publishing integrations.
- Specialized research, coding, and content agents.
- Shared task orchestration.

Requirements

- Verify external APIs and supported interfaces.
- Do not invent endpoints or assume undocumented automation.
- Apply per-agent tool permissions.
- Prevent uncontrolled agent loops.
- Add resource limits and cancellation.
- Track each workflow stage and its output.
- Obtain required authorization before external actions.

Acceptance criteria

- Every workflow stage has a verifiable output.
- Failures do not produce false completion reports.
- External service limitations are documented.
- Agent permissions cannot be escalated by the agents themselves.

---

13. Phase 9 — Windows Installer

Objective

Deliver an actual, tested Windows installer.

Tasks

1. Freeze the release scope.
2. Run the applicable test suite.
3. Run Python checks and tests.
4. Run TypeScript checks and frontend tests.
5. Build the production frontend.
6. Package the Python backend.
7. Build the Tauri installer.
8. Verify the installer artifact exists.
9. Install and launch the application.
10. Verify frontend/backend communication.
11. Verify database persistence after restart.
12. Verify logs and diagnostics.
13. Test behaviour when an optional model runtime is missing.
14. Check for dependencies on the development environment.
15. Generate a checksum and release notes.
16. Document known issues and untested scenarios.

Acceptance criteria

- A real Windows installer has been created.
- The installed app launches without the development server.
- Backend startup and frontend communication work.
- Persistent data remains available after restart.
- Missing optional dependencies do not crash the application.
- The test report accurately records passed, failed, and blocked checks.
- Installation and troubleshooting instructions are available.

Do not mark Phase 9 complete solely because a build command returned successfully. Test the installed application.

---

14. Git and Change Management

Before significant changes:

1. Inspect Git status.
2. Preserve existing user modifications.
3. Use a feature branch or worktree when appropriate.
4. Avoid unrelated refactoring.
5. Review diffs.
6. Run tests.
7. Commit only when authorized and appropriate.

Never delete Git history or overwrite the user's work to make the repository easier to manage.

Do not push code to a remote repository without the applicable user authorization.

---

15. Required Reports

At the end of every phase, provide:

Implementation report

- Phase name and status.
- Features implemented.
- Files created or modified.
- Important design decisions.
- Commands actually executed.
- Tests passed.
- Tests failed.
- Tests not run or blocked.
- Known bugs.
- Security considerations.
- Manual setup still required.
- Recommended next step.

Evidence requirements

Every claim about a working feature must be supported by actual inspection or a test.

Use the following labels:

- Verified: Directly tested or inspected successfully.
- Partially verified: Some scenarios tested, others remain untested.
- Blocked: Could not be tested due to a dependency or environment limitation.
- Not implemented: Work has not been completed.
- Failed: A test or operation did not succeed.

Never label a feature verified merely because its code exists.

---

16. Final Release Checklist

Before declaring the application ready:

- [ ] PRD requirements have been reviewed.
- [ ] Required features are implemented or clearly documented as deferred.
- [ ] Python checks pass.
- [ ] Frontend type checks pass.
- [ ] Frontend lint passes.
- [ ] Applicable automated tests pass.
- [ ] Database migrations work.
- [ ] Secrets are not embedded in the build.
- [ ] Permissions and tool policies are enforced.
- [ ] Logs and diagnostics work.
- [ ] Backend errors are handled.
- [ ] Production frontend build succeeds.
- [ ] Windows installer build succeeds.
- [ ] Installed application launches.
- [ ] Database persistence is verified.
- [ ] Missing optional dependencies are handled.
- [ ] Installation instructions are complete.
- [ ] Known limitations are documented.
- [ ] Actual test results are recorded.

---

17. First Instruction

Start with Phase 0 only.

Read "PRD.md" and "PLAN.md", inspect the workspace, verify the stack and packaging approach, and prepare the implementation plan.

Do not start full implementation yet. Do not delete or replace existing files. Do not create the final installer at this stage.

Present the Phase 0 findings and wait for approval before proceeding to Phase 1.