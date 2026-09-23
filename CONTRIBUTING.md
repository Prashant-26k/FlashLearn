# Contributing & Git Workflow Guidelines

This document outlines the standardized Git workflow, branching strategy, multi-worktree safety rules, and contribution standards for FlashLearn. All contributors—human developers and AI agents alike—must adhere strictly to these guidelines.

---

## 1. Branch Hierarchy & Pull Request Flow

FlashLearn follows a two-tier protected branch architecture:

```text
main (Production Releases)
  ↑ (Pull Request only — staging verified)
develop (Integration Baseline)
  ↑ (Pull Request only — CI/build passing)
feature/* | fix/* | refactor/* | chore/*
```

* **`main`**: The production branch representing live, deployable code. Direct commits and pushes are strictly forbidden.
* **`develop`**: The primary integration branch. All work branches off `origin/develop` and merges back into `develop` via Pull Requests.
* **Work Branches (`feature/*`, `fix/*`, `refactor/*`, `chore/*`)**: Dedicated branches for specific tasks, created from `origin/develop` and merged into `develop` via Pull Requests.

### Promotion Flow
1. **Task Branches → `develop`**: Every `feature/*`, `fix/*`, `refactor/*`, and `chore/*` branch merges into `develop` through a Pull Request.
2. **`develop` → `main`**: Production releases are promoted from `develop` into `main` through a formal Pull Request after testing.

---

## 2. Branch Naming Conventions

All new work must be based on latest `origin/develop` and prefixed according to the nature of the task:

| Prefix | Pattern | Purpose |
| :--- | :--- | :--- |
| **Feature** | `feature/<name>` | New user-facing capabilities, pages, or functional enhancements |
| **Bug Fix** | `fix/<name>` | Defect fixes and bug resolutions |
| **Refactoring** | `refactor/<name>` | Structural code improvements without behavioral or API changes |
| **Chore** | `chore/<name>` | Tooling, configurations, dependencies, workflow, or documentation |

---

## 3. Multi-Worktree Safety Rules

FlashLearn utilizes Git worktrees to allow developers and autonomous AI agents to work in parallel without collisions. To protect active work across concurrent sessions:

1. **Never switch branches in another agent's worktree**:
   - Never run `git switch`, `git checkout`, `git reset`, `git restore`, `git clean`, or similar state-changing commands inside another agent's worktree.
2. **Never overwrite or discard uncommitted changes**:
   - If a worktree contains uncommitted changes that are not part of your task, **do not touch them**.
   - Do NOT stash, reset, restore, clean, or commit files belonging to another session.
   - If uncommitted changes exist and their ownership is unclear: **STOP and ask for clarification**.
3. **Strictly prohibited destructive commands**:
   The following destructive commands are forbidden unless the user explicitly authorizes them for a specific situation:
   - `git reset --hard`
   - `git clean -fd` / `git clean -fdx`
   - `git restore .`
   - `git checkout -- .`
   - `git branch -D`
   - `git worktree remove --force`
   - `git push --force` / `git push --force-with-lease`
4. **Isolated Worktree Creation for New Tasks**:
   - For any new task, prefer creating a dedicated worktree and branch directly from `origin/develop`:
     ```bash
     git fetch origin
     git worktree add -b feature/<name> <new-worktree-path> origin/develop
     ```
     For fixes:
     ```bash
     git worktree add -b fix/<name> <new-worktree-path> origin/develop
     ```
     Use the corresponding prefix (`refactor/<name>`, `chore/<name>`) for other task types.
   - If the environment does not require a new worktree, a dedicated branch may be created in an existing isolated worktree directly from `origin/develop`, provided you first verify that the worktree is not currently in use by another agent and has no uncommitted work.

---

## 4. Pre-Flight Inspection Checklist

Before modifying code or running Git commands, always inspect the workspace:

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

## 5. Commit & Validation Standards

### Commit Safety
- **Never blindly run `git add .`** if the worktree might contain unrelated or untracked changes from other tasks.
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
Before submitting work:
1. **Build verification**: Run `npm run build` to confirm production compilation succeeds with zero errors.
2. **Lint check**: Run `npm run lint` to ensure zero ESLint errors or warnings.
3. **Tests**: Run automated tests when a test suite exists in the repository.
4. **Push branch**:
   ```bash
   git push -u origin <branch-name>
   ```
5. **Open Pull Request**: Target the **`develop`** branch on GitHub.
