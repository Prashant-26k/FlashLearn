# FlashLearn — AI Agent & Developer Guidelines

You are an AI assistant working on the **FlashLearn** codebase. You must follow the repository's Git workflow, multi-worktree safety rules, history protection safeguards, and engineering standards without exception.

---

## 1. Protected Branch & PR Rules

1. **Production Branch**: `main` represents deployed production code. **NEVER** commit, push, or rewrite history on `main`.
2. **Integration Branch**: `develop` is the shared integration baseline. **NEVER** commit, push, or rewrite history on `develop`.
3. **All New Work Starts from `origin/develop`**: Always base new work branches on the latest `origin/develop`.
4. **Universal PR Flow**:
   - `feature/*` → `develop` via Pull Request
   - `fix/*` → `develop` via Pull Request
   - `refactor/*` → `develop` via Pull Request
   - `chore/*` → `develop` via Pull Request
   - `develop` → `main` via formal release Pull Request

---

## 2. Multi-Worktree Safety & History Protection

FlashLearn uses Git worktrees for parallel agent development. Protect active work across all sessions:

1. **Dedicated Worktree Preferred**:
   - For a new task, prefer creating a dedicated worktree and branch from the latest remote `origin/develop`:
     ```bash
     git fetch origin
     git worktree add -b <type>/<name> <new-worktree-path> origin/develop
     ```
   - Types: `feature/<name>`, `fix/<name>`, `refactor/<name>`, `chore/<name>`.
2. **NEVER switch another agent's worktree**:
   - Never run `git switch`, `git checkout`, `reset`, `restore`, `clean`, or state-changing commands inside another agent's worktree.
   - Do NOT run `git switch develop` inside an arbitrary or current worktree to start a task.
3. **History-Rewrite & Ref Protection**:
   - **Never rebase shared branches** (`main`, `develop`).
   - **Never rewrite history** on `main`, `develop`, or another agent's branch.
   - **Never modify another agent's branch refs**.
   - **Never use force-push** (`git push --force` or `git push --force-with-lease`) to rewrite shared history.
   - If history rewriting is contemplated for a local private branch, obtain explicit user authorization first.
   - AI agents must never rebase or rewrite another agent's active branch or worktree.
4. **Prohibited Destructive Operations**:
   The following commands are strictly forbidden unless the user explicitly authorizes them:
   - `git reset --hard`
   - `git clean -fd` / `git clean -fdx`
   - `git restore .`
   - `git checkout -- .`
   - `git branch -D`
   - `git worktree remove --force`
   - `git push --force` / `git push --force-with-lease`
5. **Unclear Changes**:
   - If uncommitted changes exist in the current worktree and their ownership is unclear: **STOP and ask for clarification**.
   - Do NOT modify, stash, reset, restore, or commit unrelated changes.

---

## 3. Agent Execution Checklist

### Before Starting Any Work
1. Inspect the workspace using non-destructive inspection commands:
   ```bash
   git status --short
   git branch --show-current
   git worktree list
   ```
2. If the current worktree contains changes not belonging to your task, do not touch them. Use a separate worktree instead.
3. Fetch latest origin: `git fetch origin`.
4. Create your task branch and worktree from `origin/develop`.

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
   - Run existing tests using Node's test runner: `node --test "server/**/*.test.js"`.
   - *Note: `package.json` does not currently define an `npm test` script. Do not call `npm test` directly.*
5. **Push & PR**:
   - Push your branch: `git push -u origin <branch-name>`.
   - Prepare/open a Pull Request targeting **`develop`**.
