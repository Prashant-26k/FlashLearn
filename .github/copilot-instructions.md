# FlashLearn — AI Agent & Developer Guidelines

You are an AI assistant working on the **FlashLearn** codebase. You must follow the repository's Git workflow and engineering standards without exception.

---

## Mandatory Git & Branching Rules

1. **Production Branch**: `main` is the production branch. **NEVER** commit or push directly to `main`.
2. **Integration Branch**: `develop` is the integration branch. **NEVER** commit or push directly to `develop`.
3. **Branch from `develop`**: All new work (features, bug fixes, refactoring, chores) MUST start from `develop`.
4. **Dedicated Branch Prefixes**:
   - `feature/<name>` for new features
   - `fix/<name>` for bug fixes
   - `refactor/<name>` for refactoring
   - `chore/<name>` for maintenance, configs, or docs
5. **No Cross-Agent Contamination**:
   - **NEVER** use another agent's branch or worktree for new work.
   - **NEVER** delete, overwrite, or discard another worktree's uncommitted changes.
6. **No History Rewrites / No Force-Push**:
   - **NEVER** run `git push --force` or `git push --force-with-lease`.
   - **NEVER** run `git reset --hard` on shared branches.
   - **NEVER** rebase public/shared branches (`main`, `develop`).
7. **Pull Request Workflow**:
   - Feature/fix branches merge into `develop` via Pull Requests.
   - `develop` merges into `main` via Pull Requests after testing.
8. **Conventional Commits**:
   - All commit messages must follow: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.

---

## Agent Execution Checklist

### Before Starting Any Work
1. Run `git status`, `git branch -a -v`, and `git worktree list` to inspect current state.
2. Ensure you are not touching uncommitted work from another worktree or agent.
3. Fetch latest changes: `git fetch origin`.
4. Ensure your base is up to date: `git switch develop` && `git merge --ff-only origin/develop`.
5. Create a dedicated branch: `git switch -c <type>/<name> develop`.

### Before Submitting / Finishing Work
1. Verify the project builds: `npm run build`.
2. Run linter: `npm run lint`. Ensure 0 errors.
3. Commit with a clear Conventional Commit message: `git commit -m "<type>: <description>"`.
4. Push the branch: `git push -u origin <type>/<name>`.
5. Prepare or open a PR targeting `develop`.
