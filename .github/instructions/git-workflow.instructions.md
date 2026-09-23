---
description: Enforce strict Git workflow, branch naming conventions, PR requirements, and worktree safety rules for all human and AI agent contributors.
applyTo: "**/*"
---

# Git Workflow & Branching Guidelines for AI Agents

All AI agents and automated coding tools operating in this repository MUST comply with the following mandatory rules.

## Core Rules

1. **Keep `main` as Production**: `main` represents deployed production code. Never commit or push directly to `main`.
2. **Keep `develop` as Integration**: `develop` is the active development integration baseline. Never commit or push directly to `develop`.
3. **All New Work Starts from `develop`**: Always branch from the latest `origin/develop`.
4. **Branch Naming**:
   - `feature/<name>` — New features and enhancements
   - `fix/<name>` — Bug fixes
   - `refactor/<name>` — Non-functional code refactoring
   - `chore/<name>` — Tooling, dependencies, documentation, configurations
5. **No Direct Changes on Protected Branches**: Never make changes directly on `main` or `develop`.
6. **No Cross-Agent Branch Hijacking**: Never use another agent's branch for new work.
7. **Protect Worktrees**: Never delete or overwrite another worktree's uncommitted changes. Always verify `git worktree list`.
8. **PR Flow to Integration**: Feature/fix branches must merge into `develop` through Pull Requests.
9. **PR Flow to Production**: `develop` merges into `main` through a formal release Pull Request.
10. **History Preservation**: Never force-push (`git push -f`) or rewrite shared history (`git reset --hard`, rebasing shared commits).
11. **Conventional Commits**: Use `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
12. **Pre-Flight Inspection**: Before beginning work, check `git status`, current branch, and active worktrees.
13. **Post-Work Verification**: Run build (`npm run build`) and lint (`npm run lint`), commit changes cleanly, push the branch, and prepare a PR targeting `develop`.
