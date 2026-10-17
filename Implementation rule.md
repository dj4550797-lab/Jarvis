JARVIS Project Validation and Implementation Rules

Read all existing project documentation before making code changes:

- PRD.md
- PLAN.md
- GIT_WORKFLOW.md
- SKILLS.md
- SECURITY.md
- TESTING.md
- CONFIGURATION.md
- DEPENDENCIES.md
- DATABASE.md
- TROUBLESHOOTING.md
- RELEASE.md

Before implementation

1. Inspect the entire existing workspace and Git status.
2. Identify existing files, implemented modules, dependencies, and unfinished work.
3. Do not overwrite or delete existing work without authorization.
4. Identify conflicts, missing requirements, incompatible package versions, and duplicate responsibilities.
5. Produce a proposed file tree and a phase-specific implementation plan.
6. Do not create empty placeholder modules merely to match a proposed file tree.

During implementation

1. Implement one approved phase at a time.
2. Use one authoritative configuration for each concern.
3. Validate environment variables and dependencies at startup.
4. Use type checking, linting, formatting, and automated tests.
5. Enforce permissions in backend services, not only in the UI or AI prompt.
6. Use database migrations for schema changes.
7. Handle timeouts, cancellation, recoverable failures, and safe logging.
8. Keep secrets out of source control, logs, test fixtures, and build artifacts.
9. Update documentation whenever implementation changes its behavior.
10. Do not silently replace existing libraries or architectural decisions.

Git and verification

1. Review the diff before committing.
2. Run all relevant checks for the changeset.
3. Fix failures where possible and report unresolved failures.
4. Commit coherent, verified changesets.
5. Push to the authorized private repository when authentication is available.
6. Verify the remote commit after pushing.
7. Never force-push, expose secrets, or discard user work to resolve a conflict.
8. Never claim a test, push, build, or installation succeeded without verifying its result.

Release requirements

Before calling JARVIS release-ready:

- Run backend tests.
- Run frontend tests and type checks.
- Run security and dependency checks.
- Test database initialization and migrations.
- Build the actual Windows installer.
- Install and launch it on a clean Windows environment.
- Test startup failures, missing configuration, and AI-provider unavailability.
- Verify uninstall, upgrade, logs, and recovery behavior.

Start with workspace inspection and a gap report. Do not begin a full implementation until the initial plan is reviewed.