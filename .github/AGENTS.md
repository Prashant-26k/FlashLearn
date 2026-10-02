# FlashLearn — AI Agent & Developer Instructions

You are an AI software engineering agent working on the **FlashLearn** codebase.

You MUST follow the repository's Git workflow, worktree isolation rules, history-protection safeguards, engineering standards, and validation requirements defined below.

These rules take precedence over convenience. When a requested action conflicts with these rules, stop and ask for explicit authorization rather than bypassing the rule.

---

# 1. Repository Architecture

FlashLearn uses:

* `main` — production branch
* `develop` — shared integration branch
* Feature/fix branches — isolated development work
* Git worktrees — parallel development and agent isolation

The repository may contain work belonging to other developers or AI agents. Treat all existing work as potentially valuable.

**Never assume an unfamiliar change is disposable.**

---

# 2. Protected Branches

## `main`

`main` represents deployed production code.

The agent MUST NOT:

* Commit directly to `main`
* Push directly to `main`
* Reset `main`
* Rebase `main`
* Rewrite `main` history
* Force-push `main`
* Delete or recreate `main`

Changes reach `main` only through the formal release PR process.

## `develop`

`develop` is the shared integration branch.

The agent MUST NOT:

* Commit directly to `develop`
* Push directly to `develop`
* Reset `develop`
* Rebase `develop`
* Rewrite `develop` history
* Force-push `develop`

All normal development changes must reach `develop` through Pull Requests.

---

# 3. Branching Strategy

All new development work MUST originate from the latest:

```bash
origin/develop
```

Allowed branch prefixes:

```text
feature/<name>
fix/<name>
refactor/<name>
chore/<name>
```

PR flow:

```text
feature/*  ──┐
fix/*       │
refactor/*  ├──> develop
chore/*     ┘

develop ──> main
```

Normal development branches target `develop`.

Release changes from `develop` to `main` must use the formal release PR process.

---

# 4. Worktree Isolation

FlashLearn uses Git worktrees for parallel development.

For a new coding task, prefer creating a dedicated worktree from the latest `origin/develop`:

```bash
git fetch origin
git worktree add -b <type>/<name> <new-worktree-path> origin/develop
```

Example:

```bash
git fetch origin
git worktree add -b feature/user-dashboard ../flashlearn-user-dashboard origin/develop
```

## Never interfere with another worktree

Before modifying anything, inspect:

```bash
git status --short
git branch --show-current
git worktree list
```

Never switch branches inside another agent's worktree.

Do not run commands such as:

```bash
git switch
git checkout
git reset
git restore
git clean
```

inside a worktree that belongs to another task or agent.

Never use another agent's worktree as the workspace for a new task.

---

# 5. Uncommitted Changes

Existing uncommitted changes may belong to another task or agent.

If the ownership or purpose of an existing change is unclear:

**STOP. Do not modify it. Ask the user for clarification.**

Never:

* Stash another agent's work
* Reset another agent's work
* Restore another agent's files
* Clean another agent's files
* Overwrite another agent's changes
* Commit another agent's changes
* Include unrelated changes in your commit

Do not assume that an uncommitted change is accidental merely because you do not understand it.

---

# 6. History Protection

History protection is mandatory.

Never:

* Rebase `main`
* Rebase `develop`
* Rewrite another agent's branch
* Modify another agent's branch reference
* Reset another agent's branch
* Force-push shared branches
* Force-push another agent's branch

The following commands are prohibited unless the user explicitly authorizes them:

```bash
git reset --hard
git clean -fd
git clean -fdx
git restore .
git checkout -- .
git branch -D
git worktree remove --force
git push --force
git push --force-with-lease
```

Even on a private branch, history rewriting requires explicit user authorization.

This includes:

```bash
git rebase
git commit --amend
git reset
git push --force
git push --force-with-lease
```

When in doubt, preserve history.

---

# 7. Pre-Flight Procedure

Before making code changes, perform non-destructive inspection.

Run:

```bash
git status --short
git branch --show-current
git worktree list
git fetch origin
```

Then inspect the relevant code before editing it.

Determine:

1. Current branch
2. Current worktree
3. Whether uncommitted changes exist
4. Whether those changes belong to the current task
5. Current relationship with `origin/develop`
6. Relevant architecture and existing implementation
7. Existing tests and validation mechanisms

Do not start modifying files before understanding the relevant existing implementation.

---

# 8. Implementation Rules

Before changing code:

* Inspect existing implementation.
* Follow existing project architecture.
* Reuse existing utilities and abstractions where appropriate.
* Prefer the smallest correct change.
* Do not rewrite working code unnecessarily.
* Do not introduce dependencies without justification.
* Do not change unrelated files.
* Do not change APIs or data models unnecessarily.
* Preserve backward compatibility unless the task explicitly requires a breaking change.

Do not blindly implement a technically questionable request.

If you identify:

* Security risks
* Data-loss risks
* Architectural problems
* Scalability problems
* Breaking-change risks
* Significant performance problems
* Incorrect assumptions
* Unnecessary complexity

stop and explain the issue before proceeding when the risk materially affects the requested implementation.

---

# 9. Security Rules

Never:

* Hardcode API keys
* Commit secrets
* Expose server-side secrets to the frontend
* Log authentication tokens
* Log passwords
* Disable authentication merely to make development easier
* Bypass authorization checks
* Commit `.env` files containing secrets

Use environment variables for secrets and configuration.

Authentication and authorization changes require particular care because FlashLearn uses JWT and OAuth.

---

# 10. Git Staging Rules

Only stage files belonging to the current task.

Do NOT blindly use:

```bash
git add .
```

when unrelated changes may exist.

Prefer explicit staging:

```bash
git add path/to/file1 path/to/file2
```

Before committing, inspect:

```bash
git status
git diff
git diff --cached
```

Verify that:

* Only intended files are staged
* No unrelated modifications are included
* No secrets are staged
* No generated files are accidentally staged
* The diff matches the requested task

---

# 11. Commit Convention

Use Conventional Commits.

Allowed prefixes:

```text
feat:
fix:
refactor:
chore:
docs:
test:
```

Examples:

```text
feat: add user study statistics
fix: prevent duplicate flashcard generation
refactor: extract Gemini request service
chore: update dependencies
docs: document authentication flow
test: add quiz statistics tests
```

Keep commits focused and meaningful.

Do not create meaningless commits merely to produce activity.

---

# 12. Validation Requirements

For changes affecting application code, run the applicable validation checks.

Primary validation:

```bash
npm run build
npm run lint
```

Both must pass with zero errors.

Run the existing Node test suite:

```bash
node --test "server/**/*.test.js"
```

Do NOT use:

```bash
npm test
```

unless a test script is explicitly added to `package.json`.

If a validation command is not applicable to the change, explain why rather than pretending it was executed.

Never claim that a test, build, lint check, or deployment was successful unless it was actually run.

---

# 13. PR Requirements

After implementation and validation:

1. Review the final diff.
2. Confirm only task-related files changed.
3. Commit using Conventional Commits.
4. Push the task branch:

```bash
git push -u origin <branch-name>
```

5. Open a Pull Request targeting:

```text
develop
```

PR descriptions should explain:

* What changed
* Why it changed
* Important implementation details
* Validation performed
* Known limitations or follow-up work

Never merge directly into `main`.

Never bypass the PR workflow merely because the change is small.

---

# 14. Agent Communication

For non-trivial tasks, before implementation briefly state:

* What you found
* What you intend to change
* Any relevant risks

After implementation report:

* Files changed
* What was implemented
* Tests run
* Build result
* Lint result
* Any remaining issues

Be precise.

Never claim:

* "Everything works"
* "Tests passed"
* "Production is safe"
* "No issues"

unless the corresponding verification was actually performed.

---

# 15. Stop Conditions

Immediately stop and ask the user when:

1. Existing uncommitted changes have unclear ownership.
2. The requested change requires modifying `main` directly.
3. The requested change requires modifying `develop` directly.
4. History rewriting is required.
5. A destructive Git operation appears necessary.
6. Another agent's work may be affected.
7. A requested implementation creates a significant security or data-loss risk.
8. The requested task conflicts with these instructions.
9. Required information cannot be safely inferred from the repository.

Do not bypass a stop condition by making assumptions.

---

# 16. Priority Order

When instructions conflict, follow this priority:

1. User's explicit request
2. Repository safety and history protection
3. Existing architecture and project conventions
4. These engineering guidelines
5. Convenience or speed

However, an explicit user request to perform a destructive or history-rewriting operation must be understood as authorization for that specific operation; do not generalize that authorization to unrelated operations.

---

# 17. Core Principle

**Protect existing work first. Understand before modifying. Make the smallest correct change. Validate before declaring success.**

When uncertain, preserve state and ask rather than guessing.
