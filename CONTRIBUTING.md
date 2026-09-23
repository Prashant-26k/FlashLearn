# Contributing & Git Workflow Guidelines

This document outlines the standardized Git workflow, branching strategy, and contribution rules for FlashLearn. All contributors—human developers and AI agents alike—must adhere strictly to these rules.

---

## 1. Branch Hierarchy

```text
main (Production Releases)
  ↑ (PR only after staging verification)
develop (Active Integration & Staging Baseline)
  ↑ (PR only with CI/tests passing)
feature/* | fix/* | refactor/* | chore/*
```

* **`main`**: The stable, production-ready branch. Represents deployed production state.
* **`develop`**: The primary integration branch. All feature and bug-fix work branches off `develop` and merges back into `develop`.

---

## 2. Core Git Workflow Rules

1. **Keep `main` as the production branch**:
   - `main` always represents deployable, production-ready code.
2. **Keep `develop` as the integration branch**:
   - `develop` serves as the shared integration and pre-release baseline.
3. **All new work must start from `develop`**:
   - Always branch off the latest `origin/develop`. Never branch off `main` for standard feature work.
4. **Create a dedicated branch before starting work**:
   - **`feature/<name>`**: New user-facing functionality or enhancements.
   - **`fix/<name>`**: Bug fixes and defect resolutions.
   - **`refactor/<name>`**: Code refactoring without behavioral changes.
   - **`chore/<name>`**: Build, tooling, dependencies, documentation, or workflow maintenance.
5. **Never make changes directly on `main` or `develop`**:
   - Direct commits and unreviewed pushes to `main` and `develop` are strictly prohibited.
6. **Never use another agent's branch for new work**:
   - Each feature, fix, or agent task must operate on its own independent branch.
7. **Never delete or overwrite another worktree's uncommitted changes**:
   - FlashLearn utilizes Git worktrees for parallel agent development. Always inspect active worktrees before running destructive commands.
8. **Feature/fix branches merge into `develop` through PRs**:
   - Submit a Pull Request targeting `develop`. All CI checks and code reviews must pass before merging.
9. **`develop` merges into `main` through a PR**:
   - Production releases are promoted from `develop` to `main` via formal Pull Requests.
10. **Never force-push or rewrite shared branch history**:
    - `git push --force` and `git push --force-with-lease` are strictly forbidden on shared branches (`main`, `develop`). Never rebase commits that have already been pushed to shared branches.
11. **Use Conventional Commits**:
    - Commit messages must follow the Conventional Commits specification:
      - `feat: <description>` (new feature)
      - `fix: <description>` (bug fix)
      - `refactor: <description>` (refactoring)
      - `chore: <description>` (tooling, config, dependencies)
      - `docs: <description>` (documentation)
      - `test: <description>` (testing)
12. **Always inspect environment before starting work**:
    - Before beginning any task, inspect current state:
      ```bash
      git status
      git branch -a -v
      git worktree list
      ```
13. **Verification and PR submission**:
    - After completing work:
      1. Run relevant tests, linters, and production builds (`npm run build`, `npm run lint`).
      2. Ensure zero build errors and zero lint violations.
      3. Commit changes using Conventional Commits.
      4. Push the branch to `origin`:
         ```bash
         git push -u origin <branch-name>
         ```
      5. Open a Pull Request targeting `develop`.

---

## 3. Step-by-Step Developer & Agent Workflow

### Starting a New Task

```bash
# 1. Inspect existing state and worktrees
git status
git worktree list

# 2. Fetch latest changes from origin
git fetch origin

# 3. Ensure local develop is synchronized
git switch develop
git merge --ff-only origin/develop

# 4. Create a dedicated branch from develop
git switch -c feature/<short-name> develop
```

### Finishing a Task

```bash
# 1. Verify build and code quality
npm run build
npm run lint

# 2. Stage and commit with conventional message
git add <modified-files>
git commit -m "feat: implement study activity streak component"

# 3. Push to origin
git push -u origin feature/<short-name>

# 4. Open PR targeting develop on GitHub
```
