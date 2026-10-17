JARVIS Git Workflow and Repository Policy

1. Objective

Maintain a private GitHub repository for JARVIS. Preserve the complete project history and push verified code changes regularly.

2. Repository

- Repository visibility: Private.
- Default branch: "main".
- Development branch: "develop", if branch-based development is needed.
- Use feature branches for large or risky changes.
- Never create a public repository for this private project.
- Never change repository visibility without explicit user authorization.
- Do not create duplicate repositories if the intended repository already exists.

3. Initial Setup

Before initializing or modifying Git:

1. Inspect the existing ".git" directory and Git remote configuration.
2. Inspect "git status".
3. Check whether the project already has a Git history.
4. Preserve existing commits and uncommitted changes.
5. Confirm the intended GitHub account and repository name.
6. Check GitHub authentication.
7. Create a new private repository only if one does not already exist and the user has authorized its creation.
8. Configure the repository's HTTPS or SSH remote.
9. Verify the remote points to the intended private repository.
10. Never put a GitHub access token in a remote URL, source file, log, or command history.

If authentication or repository creation is unavailable, stop and provide the exact manual steps required.

4. Change-to-Commit Policy

After every coherent code change-set:

1. Review modified files.
2. Inspect the Git diff.
3. Run relevant tests and quality checks.
4. Check for secrets and accidentally included files.
5. Confirm unrelated user changes are preserved.
6. Stage only the files relevant to the change-set.
7. Create a descriptive commit.
8. Push the commit to the configured private repository.
9. Verify the push succeeded and the remote contains the expected commit.

Do not commit broken code merely to maintain frequent pushes.

A change-set may contain multiple related file edits. Do not create a separate commit for every keystroke or intermediate edit.

5. Commit Messages

Use clear messages, preferably Conventional Commits:

- "feat: add conversation streaming"
- "fix: handle unavailable model runtime"
- "test: add memory persistence tests"
- "docs: update installation instructions"
- "refactor: separate provider routing"
- "build: improve Windows packaging"

Never use misleading messages such as "everything fixed" when the change is not verified.

6. Git Hooks

Install repository-local hooks using a maintained hook manager or a documented native Git hooks setup.

Pre-commit hook

Run applicable fast checks, such as:

- Python formatting and lint checks.
- Python syntax and import checks.
- TypeScript type checking.
- Frontend lint.
- Secret scanning.
- Whitespace and conflict-marker checks.

Run only the checks supported by the current project. Document any unavailable check.

Pre-push hook

Run the appropriate pre-push test suite or release checks.

Use a fast local test suite for routine changes. Run the full integration and packaging suite at suitable milestones.

If a required check fails, block the commit or push where practical. Never bypass a failed check without an explicit, documented reason.

Hooks are a quality safeguard, not a replacement for CI.

7. Secrets and Sensitive Data

The following must never be committed:

- ".env" files containing real credentials.
- API keys or access tokens.
- Private keys.
- Passwords.
- Authentication cookies.
- Private diagnostic bundles.
- Personal recordings or screenshots not explicitly approved for version control.
- Local databases containing private conversation or memory data.
- Build outputs and temporary files unless deliberately required.

Maintain a reviewed ".gitignore" that covers:

- Python virtual environments.
- Python caches.
- Node dependencies.
- Build outputs.
- Local databases.
- Logs.
- Environment files.
- IDE-specific files.
- Temporary files.

Keep ".env.example" with placeholders only.

Run a secret scanner before committing and pushing. If a secret is accidentally committed, remove it from the repository and rotate the exposed credential; deleting it in a later commit does not erase it from Git history.

8. Push Behaviour

After a successful commit:

1. Push the intended branch to the intended remote.
2. Check the command's exit status.
3. Confirm the pushed commit hash.
4. Report success only after verification.

If push fails:

- Do not claim it succeeded.
- Preserve the local commit.
- Diagnose authentication, connectivity, permissions, or branch conflicts.
- Do not force-push as an automatic fix.
- Never discard remote or local history to make a push succeed.
- Report the error and request assistance when required.

9. Remote Conflicts

If the remote contains new commits:

1. Fetch and inspect the difference.
2. Preserve local and remote work.
3. Review conflicts.
4. Resolve conflicts deliberately.
5. Run the relevant tests again.
6. Push only after verifying the resulting history.

Never use "git push --force" or "git reset --hard" as a routine recovery action.

10. GitHub Actions

Where supported, configure private-repository CI to run:

- Backend tests.
- Frontend type checks.
- Frontend lint.
- Frontend tests.
- Secret scanning.
- Build checks.

Pin third-party actions to reviewed versions or immutable references according to the repository's security policy.

Do not expose secrets in workflow output.

11. Reporting

For each completed change-set, report:

- Files changed.
- Checks executed.
- Test results.
- Commit hash.
- Branch.
- Push status.
- Remote URL, without credentials.
- Known issues or blocked steps.

Use accurate labels: passed, failed, blocked, or not run.

12. Safety

- Never publish the repository publicly.
- Never push credentials.
- Never discard user changes.
- Never commit generated files containing personal data.
- Never claim a push succeeded without verification.
- Never bypass failing tests silently.
- Never make repository visibility or access-permission changes without authorization.
- Preserve the repository history.


Instruction Imp:


 Read "PRD.md", "PLAN.md", and "GIT_WORKFLOW.md" before making changes.

Add the Git workflow to the JARVIS project.

First inspect the existing repository and Git configuration. Do not overwrite or delete any existing work.

I want a private GitHub repository for JARVIS. If a suitable repository already exists, reuse it. Otherwise, create a new private repository only if GitHub access and authorization are available.

Configure Git hooks for pre-commit and pre-push checks. Use a suitable, maintained hook manager if compatible with the project; otherwise document and configure native Git hooks. Add a reviewed ".gitignore", ".env.example", secret scanning, and appropriate automated checks.

After each coherent code change-set:

1. Review the diff.
2. Run relevant checks and tests.
3. Stage only related files.
4. Commit with a descriptive message.
5. Push to the configured private GitHub repository.
6. Verify the push result.
7. Report the commit hash and test results.

Do not commit broken code merely to push frequently. Do not push after every keystroke; commit and push after each verified, coherent change-set.

Never expose credentials, create a public repository, force-push automatically, delete existing history, or claim a push succeeded without verification.

If GitHub authentication or repository creation requires my action, tell me exactly what I need to do. Do not pretend the repository or hooks are configured until they have actually been created and tested.

Start with inspection and a proposed setup plan. Preserve all existing work and wait for my approval before any destructive or externally visible operation.

