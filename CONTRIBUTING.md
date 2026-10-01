# Contributing & Git Workflow Guidelines

This document serves as the **human-facing source of truth** for FlashLearn's Git workflow, branching hierarchy, multi-worktree safety rules, and engineering standards. Machine-readable instructions and AI agent rules are located in `.github/` and are strictly synchronized with this document.

---

## 1. Branch Hierarchy & Pull Request Flow

FlashLearn enforces a structured two-tier branch hierarchy:

```text
main (Production Releases)
  ↑ (Pull Request only — staging verified)
develop (Integration Baseline)
  ↑ (Pull Request only — CI/build/tests passing)
feature/* | fix/* | refactor/* | chore/*
```

* **`main`**: The production branch representing live, deployable code. Direct commits, pushes, and history modifications are strictly prohibited.
* **`develop`**: The shared integration baseline. All new work branches off `origin/develop` and merges back into `develop` through Pull Requests.
* **Work Branches (`feature/*`, `fix/*`, `refactor/*`, `chore/*`)**: Dedicated branches created from `origin/develop` for specific tasks.

### Promotion Flow
1. **Task Branches → `develop`**: Every `feature/*`, `fix/*`, `refactor/*`, and `chore/*` branch merges into `develop` via a Pull Request.
2. **`develop` → `main`**: Production releases are promoted from `develop` into `main` via a formal release Pull Request after verification.

---

## 2. Branch Naming Conventions

All new work branches off latest `origin/develop` using one of the established prefixes:

| Prefix | Pattern | Purpose |
| :--- | :--- | :--- |
| **Feature** | `feature/<name>` | New user-facing capabilities, pages, or functional enhancements |
| **Bug Fix** | `fix/<name>` | Defect fixes and bug resolutions |
| **Refactoring** | `refactor/<name>` | Structural code improvements without behavioral or API changes |
| **Chore** | `chore/<name>` | Tooling, configurations, dependencies, workflow, or documentation |

---

## 3. Multi-Worktree Safety & Isolation

FlashLearn uses Git worktrees to allow developers and autonomous AI agents to collaborate concurrently without workspace collisions:

1. **Dedicated Worktree Preferred**:
   - The preferred workflow for any new task or AI agent session is to create a dedicated worktree and branch directly from `origin/develop`:
     ```bash
     git fetch origin
     git worktree add -b feature/<name> <new-worktree-path> origin/develop
     ```
     (Use `fix/`, `refactor/`, or `chore/` as appropriate).
   - If working in an existing isolated worktree without creating a new directory, create the branch from `origin/develop` only after verifying that the worktree is not currently in use by another agent and contains no uncommitted work.
2. **Never switch branches in another agent's worktree**:
   - Never run `git switch`, `git checkout`, `git reset`, `git restore`, `git clean`, or similar state-changing commands inside another agent's worktree.
3. **Never overwrite or discard uncommitted work**:
   - If a worktree contains uncommitted changes that are not part of your task, **do not touch them**.
   - Do NOT stash, reset, restore, clean, or commit files belonging to another session.
   - If uncommitted changes exist and their ownership is unclear: **STOP and ask for clarification**.

---

## 4. History-Rewrite Safety & Ref Protection

To safeguard the repository against data loss and history divergence:

1. **Never rebase shared branches**: Rebase is strictly prohibited on `main` and `develop`.
2. **Never rewrite history on shared or active branches**: Never rewrite history on `main`, `develop`, or another agent's active branch.
3. **Never modify another agent's branch refs**: Do not update, reset, delete, or retarget branch references belonging to another active task or worktree.
4. **Never force-push to shared branches**: `git push --force` and `git push --force-with-lease` are forbidden on `main` and `develop`.
5. **Local history rewriting requires authorization**: If history rewriting (such as squashing or amending) is considered for a local private branch, obtain explicit user authorization first.
6. **Prohibited destructive commands**: The following commands are forbidden unless the user explicitly authorizes them for a specific situation:
   - `git reset --hard`
   - `git clean -fd` / `git clean -fdx`
   - `git restore .`
   - `git checkout -- .`
   - `git branch -D`
   - `git worktree remove --force`
   - `git push --force` / `git push --force-with-lease`

---

## 5. Pre-Flight Workspace Inspection

Before modifying codebase files or creating branches, inspect the workspace using non-destructive inspection commands:

```bash
# 1. Check working directory status
git status --short

# 2. Check the currently active branch
git branch --show-current

# 3. Check all active worktrees
git worktree list
```

* If the worktree contains changes unrelated to your current assignment, **do not proceed in that worktree**. Create a dedicated worktree or branch instead.

---

## 6. Commit & Validation Standards

### Commit Safety
- **Never blindly run `git add .`** when the worktree might contain untracked or unrelated files.
- Stage only files explicitly modified for the current task:
  ```bash
  git add <path/to/modified-file>
  ```
- Always inspect your staged changes before committing:
  ```bash
  git status
  git diff
  git diff --cached
  ```
- Use **Conventional Commits**:
  - `feat: ...` — New features
  - `fix: ...` — Bug fixes
  - `refactor: ...` — Code refactoring
  - `chore: ...` — Maintenance, tooling, configs, docs
  - `docs: ...` — Documentation
  - `test: ...` — Tests

### Verification Before Opening a PR
Before submitting any work:
1. **Build verification**: Run `npm run build` to confirm production compilation succeeds with zero errors.
2. **Lint check**: Run `npm run lint` to ensure zero ESLint errors or warnings.
3. **Test execution**:
   - Run the repository's existing Node tests using Node's built-in test runner:
     ```bash
     node --test "server/**/*.test.js"
     ```
   - *Note: `package.json` does not currently define an `npm test` script. Do not invoke `npm test` directly unless that script is added to `package.json`.*
4. **Push branch**:
   ```bash
   git push -u origin <branch-name>
   ```
5. **Open Pull Request**: Target the **`develop`** branch on GitHub.
