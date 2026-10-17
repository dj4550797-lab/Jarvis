JARVIS — Skills System Specification

Version: 1.0
Project: JARVIS Personal AI Assistant
Primary Builder: Google Antigravity
Related Documents: "PRD.md", "PLAN.md", "GIT_WORKFLOW.md"

---

1. Purpose

Create a modular, extensible skill system that allows JARVIS to perform specific tasks through registered, tested, and permission-controlled capabilities.

A skill is a self-contained capability with:

- A unique identifier.
- A description.
- A defined input schema.
- A defined output schema.
- Required permissions.
- Execution rules.
- Timeouts and cancellation support.
- Error handling.
- Logging.
- Tests.
- Documentation.

Skills must not have unrestricted access to the operating system, database, credentials, or other skills.

2. Core Requirements

The skills framework must:

1. Register and discover available skills.
2. Validate skill inputs.
3. Check permissions before execution.
4. Execute skills through a controlled runtime.
5. Return structured results.
6. Report failures accurately.
7. Support cancellation and timeouts where applicable.
8. Log important execution events.
9. Support enabling and disabling skills.
10. Support versioning and compatibility checks.
11. Allow new skills to be added without rewriting the entire assistant.
12. Test skills independently.
13. Prevent one skill from silently escalating its permissions.
14. Keep skill definitions separate from the AI model's instructions.

3. Skill Categories

3.1 Conversation Skills

Examples:

- Natural conversation.
- Summarization.
- Explanation.
- Translation.
- Writing assistance.
- Structured response generation.

These skills may use the configured AI provider but must report provider errors honestly.

3.2 Memory Skills

Examples:

- Save a user-approved memory.
- Search stored memories.
- Retrieve relevant project context.
- Edit a memory.
- Delete a memory.
- Export memory.

Memory operations must follow the privacy rules defined in "PRD.md".

3.3 Research Skills

Examples:

- Search permitted sources.
- Open and inspect supported pages.
- Collect source references.
- Summarize evidence.
- Compare sources.
- Produce research notes.
- Identify unsupported claims.

Research output must distinguish verified information from assumptions. A skill must not fabricate source references.

3.4 Coding Skills

Examples:

- Inspect a project.
- Search source code.
- Explain an error.
- Diagnose a stack trace.
- Propose a fix.
- Create a focused patch.
- Review a Git diff.
- Run approved tests.
- Explain test failures.

Coding skills must operate only in approved project locations. Significant edits must be reviewable and recoverable.

3.5 Computer-Control Skills

Examples:

- Open an approved application.
- Search an approved folder.
- Read a supported document.
- Create a file in an approved workspace.
- Play or pause supported media.
- Capture a screenshot after user authorization.

Every computer-control skill must use the central permission system. Do not expose unrestricted shell access.

3.6 Voice Skills

Examples:

- Speech-to-text.
- Text-to-speech.
- Voice selection.
- Audio playback control.
- Optional wake-word detection.

Voice skills must respect microphone permissions, visible recording status, quiet hours, and stop controls.

3.7 Device and Vision Skills

Examples:

- Detect available devices.
- Diagnose microphone access.
- Diagnose camera access.
- Capture an authorized screenshot.
- Process a user-provided image.
- Analyze an image using a compatible model.

Never claim a device or vision capability works unless its integration is available and verified.

3.8 Workflow Skills

Examples:

- Run a sequence of approved tasks.
- Track progress.
- Save outputs.
- Retry recoverable operations.
- Stop a running workflow.
- Produce a completion report.

Workflows must have explicit steps, cancellation, and failure handling.

3.9 Content Production Skills

Future examples:

- Research a documentary topic.
- Create an outline.
- Write a script.
- Break a script into scenes.
- Prepare image and video prompts.
- Organize generated assets.
- Assemble media through a verified tool.
- Prepare metadata and thumbnail concepts.
- Upload content through a supported and authorized integration.

Do not assume a third-party creative tool supports automation until its available interfaces have been verified.

3.10 Gaming Assistance Skills

Optional future examples:

- Analyze a user-provided audio sample.
- Identify likely audible events.
- Provide sensitivity-setting suggestions.
- Explain uncertainty in audio direction estimates.

Do not implement cheating, unauthorized game manipulation, or anti-cheat bypasses.

---

4. Skill Architecture

Use a central registry and execution service.

User Request
     |
     v
JARVIS Orchestrator
     |
     v
Skill Discovery
     |
     v
Input Validation
     |
     v
Permission Check
     |
     v
Skill Execution Runtime
     |
     v
Result Validation
     |
     v
Audit Log + User Response

The AI model may suggest which skill to use, but the model must not grant permissions or bypass validation.

The runtime must enforce authorization independently of model instructions.

5. Recommended File Structure

Create these modules as the framework is implemented. Do not create empty placeholder files for every future skill.

backend/
└── app/
    ├── skills/
    │   ├── __init__.py
    │   ├── base.py
    │   ├── registry.py
    │   ├── executor.py
    │   ├── schemas.py
    │   ├── results.py
    │   ├── permissions.py
    │   ├── discovery.py
    │   ├── versioning.py
    │   ├── errors.py
    │   ├── builtin/
    │   │   ├── __init__.py
    │   │   ├── conversation.py
    │   │   ├── memory.py
    │   │   └── diagnostics.py
    │   └── tests/
    │       ├── test_registry.py
    │       ├── test_executor.py
    │       ├── test_permissions.py
    │       └── test_results.py

As new features are implemented, add separate skill modules for research, coding, voice, computer control, and workflows.

Keep skills independent from the frontend. The frontend should call the backend API instead of importing skill implementation code.

6. Skill Contract

Every skill must follow a common interface.

Conceptual Python example:

class Skill:
    id: str
    name: str
    description: str
    version: str

    def input_schema(self):
        ...

    def required_permissions(self):
        ...

    async def execute(self, context, arguments):
        ...

    async def health_check(self):
        ...

This is an interface illustration, not complete production code. The implementation must use appropriate Python typing, Pydantic validation, and documented error handling.

Required metadata

Each registered skill must declare:

- "id"
- "name"
- "description"
- "version"
- "enabled"
- "input_schema"
- "output_schema"
- "required_permissions"
- "risk_level"
- "timeout_seconds"
- "supports_cancellation"
- "requires_network"
- "requires_model"
- "supported_platforms"

Optional capabilities must be represented explicitly rather than assumed.

7. Input and Output Validation

Inputs

- Validate all inputs before execution.
- Reject unknown or invalid arguments unless explicitly allowed by the schema.
- Limit string lengths, file sizes, and list sizes.
- Validate file paths and external URLs where applicable.
- Never trust model-generated arguments.
- Never execute unvalidated shell commands.

Outputs

Return a structured result with:

- Status.
- Skill ID and version.
- Result data.
- User-readable summary.
- Error code when applicable.
- Error details safe for the user.
- Execution timestamps.
- References or output file locations when relevant.

Use explicit statuses such as:

- "SUCCEEDED"
- "FAILED"
- "CANCELLED"
- "TIMED_OUT"
- "BLOCKED"
- "NEEDS_USER_INPUT"

A skill must not return "SUCCEEDED" if its core operation failed.

8. Permission System

Permissions must be centrally defined.

Example permission categories:

- "memory.read"
- "memory.write"
- "filesystem.read"
- "filesystem.write"
- "application.launch"
- "microphone.capture"
- "camera.capture"
- "screen.capture"
- "network.access"
- "external_message.send"
- "content.publish"
- "process.execute"

These are illustrative identifiers. The implementation must define exact scopes and enforcement rules.

Rules

1. A skill can request only declared permissions.
2. The permission system decides whether access is allowed.
3. The AI model cannot approve its own permission request.
4. Skills cannot grant permissions to other skills.
5. Disabled skills cannot execute.
6. High-impact operations require applicable authorization.
7. Permission denial must be logged safely.
8. Users must be able to review and revoke permissions.
9. External actions must have a verifiable result.
10. Untrusted document content cannot override permission policies.

Routine capabilities may be pre-authorized within narrow scopes. Sensitive actions must follow the central authorization policy in "PRD.md".

9. Skill Discovery and Registration

The registry must:

- Load approved built-in skills.
- Validate metadata during registration.
- Reject duplicate IDs.
- Reject incompatible versions.
- Track enabled and disabled states.
- Display capability information.
- Prevent untrusted skills from loading automatically.
- Report missing dependencies.
- Support health checks.

Do not execute arbitrary Python files simply because they exist in a skills directory.

Initially, support built-in, reviewed skills. A future plugin-style skill installation system requires a separate security design.

10. Skill Execution

The executor must:

1. Resolve the skill ID.
2. Confirm the skill exists and is enabled.
3. Validate arguments.
4. Check permissions.
5. Check required dependencies.
6. Apply timeout and cancellation controls.
7. Execute the skill.
8. Validate its result.
9. Write a safe audit event.
10. Return the result to the orchestrator.

Handle exceptions without swallowing them silently.

A failure in one skill must not crash the entire JARVIS application.

For expensive operations, use the task manager defined in "PRD.md".

11. Error Handling

Define clear errors for:

- Skill not found.
- Skill disabled.
- Invalid arguments.
- Permission denied.
- Missing dependency.
- Provider unavailable.
- Network unavailable.
- Timeout.
- Cancellation.
- Invalid result.
- Internal execution failure.

The UI should explain what happened and whether retrying is appropriate.

Do not automatically retry operations that may have caused external side effects.

12. Logging and Audit

Record:

- Skill ID and version.
- Start and end times.
- Outcome.
- Duration.
- Required permission category.
- Safe error code.
- Output references when appropriate.

Do not log credentials, unnecessary private conversation content, raw authentication tokens, or sensitive media.

Allow users to inspect skill activity and disable a skill.

13. Testing Requirements

Every skill must have tests for:

- Valid inputs.
- Invalid inputs.
- Permission granted.
- Permission denied.
- Disabled skill.
- Missing dependencies.
- Execution failure.
- Timeout.
- Cancellation, where supported.
- Output validation.
- Safe logging.

The registry and executor must have their own unit tests.

Integration tests must verify that unauthorized tool calls are blocked even when the model requests them.

Do not mark a skill as verified merely because its module imports successfully.

14. Skill Versioning and Updates

Each skill must have a version.

Updates must:

- Preserve compatibility where possible.
- Document breaking changes.
- Pass relevant tests.
- Preserve user data.
- Avoid silently expanding permissions.
- Support rollback where practical.

A skill update must not automatically grant new permissions.

15. Self-Improvement

JARVIS may improve its workflows by:

- Remembering successful user-approved procedures.
- Reusing validated steps.
- Identifying recurring failures.
- Suggesting better workflows.
- Updating documentation after verified changes.

It must not silently rewrite its own permission policies, install arbitrary code, or modify its own core runtime without review and testing.

Saved memories and workflow records are not the same as model training.

16. Skill Development Workflow

For every new skill:

1. Define the user problem.
2. Write the skill specification.
3. Define input/output schemas.
4. Define permissions and risk level.
5. Implement the smallest working version.
6. Add unit tests.
7. Add integration tests where required.
8. Run relevant quality checks.
9. Review the code and diff.
10. Update documentation.
11. Commit the verified change-set according to "GIT_WORKFLOW.md".
12. Push to the configured private repository and verify success.

If GitHub authentication is unavailable, report the blocker instead of claiming the code was pushed.

17. Initial Implementation Order

Build skills in this order:

Stage 1: Skill Framework

- Base interface.
- Metadata schema.
- Registry.
- Input validation.
- Result schema.
- Permission integration.
- Executor.
- Error handling.
- Logging.
- Unit tests.

Stage 2: Safe Built-in Skills

- Health diagnostics.
- Basic conversation integration.
- Memory read/write through the memory service.

Stage 3: Voice Skills

- STT adapter.
- TTS adapter.
- Device checks.
- Recording/playback controls.

Stage 4: Computer Tools

- Approved file search.
- Safe document reading/writing.
- Approved application launch.
- Permission enforcement.

Stage 5: Research and Coding

- Source-backed research.
- Project inspection.
- Code diagnostics.
- Diff-based changes.
- Test execution.

Stage 6: Workflows and Agents

- Multi-step workflows.
- Task monitoring.
- Cancellation.
- Specialized agents.
- Content-production workflows.

Do not implement all stages simultaneously.

18. Acceptance Criteria

The skills system is ready for initial use when:

- Skills can be registered and discovered.
- Duplicate or invalid skills are rejected.
- Inputs are validated.
- Permissions are enforced independently of the model.
- Disabled skills cannot run.
- Results use a consistent schema.
- Failures are logged and reported accurately.
- Timeouts and cancellation work where supported.
- Tests verify both allowed and denied operations.
- Documentation matches the actual implementation.

19. Initial Antigravity Instruction

Read "PRD.md", "PLAN.md", "GIT_WORKFLOW.md", and "SKILLS.md".

Inspect the current workspace before changing files.

First implement only the Stage 1 skill framework, after the foundational application architecture is ready. Do not implement every future skill now.

Reuse existing permission, logging, task, and error-handling services instead of creating conflicting duplicate systems.

Write tests, run the relevant checks, review the diff, update documentation, and follow "GIT_WORKFLOW.md".

Do not claim that a skill is functional unless it has been implemented and tested. Preserve existing work and report all blocked or unverified items honestly.