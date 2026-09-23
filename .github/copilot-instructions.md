# FlashLearn — AI Agent & Developer Guidelines

You are an AI assistant working on the **FlashLearn** codebase. You must follow the repository's Git workflow, multi-worktree safety rules, and engineering standards without exception.

---

## 1. Protected Branch & PR Rules

1. **Production Branch**: `main` represents deployed production code. **NEVER** commit or push directly to `main`.
2. **Integration Branch**: `develop` is the shared integration baseline. **NEVER** commit or push directly to `develop`.
3. **All New Work Starts from `origin/develop`**:
   - Always base new work branches on the latest `origin/develop`.
4. **Consistent PR Flow**:
   - `feature/*` → `develop` via Pull Request
   - `fix/*` → `develop` via Pull Request
   - `refactor/*` → `develop` via Pull Request
   - `chore/*` → `develop` via Pull Request
   - `develop` → `main` via formal release Pull Request

---

## 2. Multi-Worktree Safety & Uncommitted Work Protection

FlashLearn uses Git worktrees for parallel agent development. Protect active work across all sessions:

1. **NEVER switch another agent's worktree**:
   - Never run `git switch`, `git checkout`, `reset`, `restore`, `clean`, or state-changing commands inside another agent's worktree.
   - Do NOT run `git switch develop` inside an arbitrary or current worktree to start a task.
2. **Dedicated Branch & Worktree Creation**:
   - For a new task, prefer creating a dedicated worktree and branch from latest remote `origin/develop`:
     ```bash
     git fetch origin
     git worktree add -b <type>/<name> <new-worktree-path> origin/develop
     ```
   - Types: `feature/<name>`, `fix/<name>`, `refactor/<name>`, `chore/<name>`.
   - If working in an isolated worktree without creating a new directory, create the branch directly from `origin/develop` only after verifying the worktree is not in use and has no uncommitted work.
3. **Prohibited Destructive Operations**:
   The following commands are strictly forbidden unless the user explicitly authorizes them:
   - `git reset --hard`
   - `git clean -fd` / `git clean -fdx`
   - `git restore .`
   - `git checkout -- .`
   - `git branch -D`
   - `git worktree remove --force`
   - `git push --force` / `git push --force-with-lease`
4. **Unclear Changes**:
   - If uncommitted changes are detected in the current worktree and their ownership is unclear: **STOP and ask for clarification**.
   - Do NOT modify, stash, reset, restore, or commit unrelated changes.

---

## 3. Agent Execution Checklist

### Before Starting Any Work
1. Run pre-flight inspection:
   ```bash
   git status --short
   git branch --show-current
   git worktree list
   ```
2. If the current worktree contains changes not belonging to your task, do not touch them. Use a separate worktree instead.
3. Fetch latest origin: `git fetch origin`.
4. Create your task branch from `origin/develop`.

### Commit & Validation Standards
1. **Selective Staging**: Stage only files belonging to the current task. Never blindly run `git add .` when unrelated changes might exist.
2. **Review Changes**: Inspect before committing:
   ```bash
   git status
   git diff
   git diff --cached
   ```
3. **Conventional Commits**: Format commit messages as `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
4. **Validation**:
   - Run `npm run build` (must pass with 0 errors).
   - Run `npm run lint` (must pass with 0 errors).
   - Run tests if an automated test suite is configured.
5. **Push & PR**:
   - Push your branch: `git push -u origin <branch-name>`.
   - Prepare/open a Pull Request targeting **`develop`**.
