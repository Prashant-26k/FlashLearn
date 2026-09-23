---
description: Mandatory Git workflow, multi-worktree safety rules, prohibited destructive commands, and PR conventions for AI agents.
applyTo: "**/*"
---

# Git Workflow & Multi-Worktree Safety Guidelines for AI Agents

All AI agents and automated coding tools operating in this repository MUST comply with the following mandatory rules.

---

## 1. Protected Branch Architecture & PR Flow

1. **`main` (Production)**: Deployable production code. Never commit or push directly to `main`.
2. **`develop` (Integration)**: Active development baseline. Never commit or push directly to `develop`.
3. **Branch from `origin/develop`**: All new work must branch from the latest `origin/develop`.
4. **Universal PR Flow**:
   - `feature/*` → `develop` via Pull Request
   - `fix/*` → `develop` via Pull Request
   - `refactor/*` → `develop` via Pull Request
   - `chore/*` → `develop` via Pull Request
   - `develop` → `main` via formal release Pull Request

---

## 2. Multi-Worktree Safety & Isolation

FlashLearn uses Git worktrees for parallel execution across agents. To prevent data loss or workspace collision:

1. **Never switch branches inside another agent's worktree**:
   - Never run `git switch`, `git checkout`, `reset`, `restore`, `clean`, or similar state-changing commands inside another agent's worktree.
   - Do NOT run `git switch develop` inside the current or arbitrary worktree to begin a task.
2. **Standard Worktree Creation for New Tasks**:
   ```bash
   git fetch origin
   git worktree add -b <prefix>/<name> <new-worktree-path> origin/develop
   ```
   Prefixes: `feature/`, `fix/`, `refactor/`, `chore/`.
   If working within an existing isolated worktree, verify it is unused and clean before branching from `origin/develop`.
3. **Prohibited Destructive Operations**:
   The following commands are strictly forbidden unless explicitly authorized by the user:
   - `git reset --hard`
   - `git clean -fd` / `git clean -fdx`
   - `git restore .`
   - `git checkout -- .`
   - `git branch -D`
   - `git worktree remove --force`
   - `git push --force` / `git push --force-with-lease`
4. **Uncommitted Work Protection**:
   - If uncommitted changes exist in a worktree and their ownership or relation to your task is unclear: **STOP and ask for clarification**.
   - Do NOT stash, overwrite, commit, or discard another agent's uncommitted work.

---

## 3. Agent Execution Protocol

### Step 1: Pre-Flight Inspection
Always inspect the environment before performing work:
```bash
git status --short
git branch --show-current
git worktree list
```
If unrelated changes exist in the worktree, do NOT modify them. Use a separate worktree instead.

### Step 2: Implementation & Staging Safety
- Only stage files directly modified for your task.
- **Never blindly run `git add .`** when the worktree may contain unrelated changes.
- Review changes before committing:
  ```bash
  git status
  git diff
  git diff --cached
  ```
- Commit using Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`).

### Step 3: Validation & PR
1. Run `npm run build` (must pass with 0 errors).
2. Run `npm run lint` (must pass with 0 errors).
3. Run automated tests if a test suite exists.
4. Push to remote: `git push -u origin <branch-name>`.
5. Open a Pull Request targeting **`develop`**.
