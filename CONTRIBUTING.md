# Contributing & Git Workflow Guidelines

## Branching Strategy

We follow a structured branching model to ensure stability and seamless collaboration:

```text
main (production releases)
  ↑ (PR only)
develop (integration & staging baseline)
  ↑ (PR only)
feature/* | fix/* | refactor/* | chore/*
```

### Core Branching Rules
1. **Never work or commit directly on `main`**.
2. **Never work or commit directly on `develop`**.
3. **No force pushes** (`git push --force` or `--force-with-lease`) to `main` or `develop`.
4. Feature and bug-fix branches merge into `develop` through Pull Requests (PRs).
5. `develop` merges into `main` through Pull Requests (PRs) after testing and staging verification.

---

## Branch Naming Conventions

All new work must branch off the latest `develop` branch using the appropriate prefix:

| Type | Branch Pattern | Description |
| :--- | :--- | :--- |
| **New Feature** | `feature/<short-description>` | Implementing user-facing functionality or enhancements |
| **Bug Fix** | `fix/<short-description>` | Resolving a bug or defect |
| **Refactoring** | `refactor/<short-description>` | Code improvements without altering behavior |
| **Maintenance / Setup** | `chore/<short-description>` | Build, tooling, dependencies, or documentation updates |

---

## Standard Workflow for Developers & AI Agents

Before making any code changes:
1. **Fetch latest upstream changes**:
   ```bash
   git fetch origin
   ```
2. **Ensure your base is up to date**:
   ```bash
   git switch develop
   git merge --ff-only origin/develop
   ```
3. **Create a dedicated branch**:
   ```bash
   git switch -c feature/<feature-name> develop
   ```
4. **Work only inside your branch/worktree**:
   - Do not modify or overwrite another developer's or agent's worktree/branch.
   - Verify branch status before making modifications.
5. **Verify changes**:
   - Run relevant tests (build / lint).
   - Ensure `npm run build` passes with zero errors.
6. **Commit with conventional messages**:
   ```text
   feat: ...
   fix: ...
   refactor: ...
   chore: ...
   docs: ...
   test: ...
   ```
7. **Push your branch to origin**:
   ```bash
   git push -u origin <branch-name>
   ```
8. **Open a Pull Request targeting `develop`**.
