# Contributing to hono-problem-details

Thank you for your interest in contributing!

## Development Setup

```bash
git clone https://github.com/paveg/hono-problem-details.git
cd hono-problem-details
pnpm install
```

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm test` | Run tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint` | Run Biome linter |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm typecheck` | Run TypeScript type check |
| `pnpm build` | Build with tsup |

## Workflow

1. Fork the repository
2. Create a branch from `main`
3. **Write tests first** (TDD: Red → Green → Refactor)
4. Implement the feature
5. Ensure all checks pass: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
6. Run `pnpm changeset` to create a changeset
7. Submit a pull request

## Code Style

- **Biome** handles all formatting and linting (no ESLint or Prettier)
- Tabs for indentation, double quotes, semicolons always, 100-char line width
- Comments: write "why", not "what"

## Test Coverage

We maintain **100% test coverage** on all metrics (statements, branches, functions, lines). All new code must include comprehensive tests.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
