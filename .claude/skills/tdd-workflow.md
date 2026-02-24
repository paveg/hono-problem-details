# TDD Workflow

Standard development workflow for this project.

## Process

### 1. Issue
```bash
gh issue create --title "<type>: <description>" --body "<details>"
```

### 2. Branch
```bash
git checkout main && git pull
git checkout -b <type>/<short-name>
```
Types: `feat/`, `fix/`, `chore/`, `docs/`

### 3. Red: Write Failing Tests
- Create or update test file in `tests/`
- Use prefix IDs for test names (H1, F1, Z1, etc.)
- Run: `pnpm test` — confirm tests fail

### 4. Green: Implement
- Write minimal code to pass tests
- Run: `pnpm test` — confirm tests pass

### 5. Refactor
- Clean up without changing behavior
- Run: `pnpm lint:fix && pnpm typecheck && pnpm vitest run --coverage`
- Ensure 100% coverage maintained

### 6. PR
```bash
git add <specific-files>
git commit -m "<type>: <description>

<body>

Closes #<issue-number>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
git push -u origin <branch>
gh pr create --title "<type>: <description>" --body "..."
gh pr merge <number> --squash --auto
```

## Quality Checks

All must pass before PR:
- `pnpm lint` — no lint errors
- `pnpm typecheck` — no type errors
- `pnpm vitest run --coverage` — 100% coverage on all metrics
