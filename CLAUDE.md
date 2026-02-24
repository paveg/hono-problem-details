# hono-problem-details

RFC 9457 Problem Details middleware for Hono.

## Architecture

```
src/
├── types.ts                    # Core types (ProblemDetails, ProblemDetailsInput, options)
├── status.ts                   # HTTP status code → phrase/slug mapping
├── error.ts                    # ProblemDetailsError class + normalization
├── factory.ts                  # problemDetails() factory function
├── handler.ts                  # problemDetailsHandler() for app.onError
├── registry.ts                 # createProblemTypeRegistry() for type-safe errors
├── index.ts                    # Public re-exports
└── integrations/
    ├── zod.ts                  # zodProblemHook() for @hono/zod-validator
    ├── valibot.ts              # valibotProblemHook() for @hono/valibot-validator
    ├── openapi.ts              # ProblemDetailsSchema for @hono/zod-openapi
    └── standard-schema.ts      # standardSchemaProblemHook() for @hono/standard-validator
```

## Commands

```bash
pnpm test              # vitest run
pnpm test:watch        # vitest (watch mode)
pnpm lint              # biome check .
pnpm lint:fix          # biome check --write .
pnpm typecheck         # tsc --noEmit
pnpm build             # tsup (ESM + CJS dual output)
```

## Code Style

- **Formatter**: Biome — tabs, double quotes, semicolons always, 100 char line width
- **Linter**: Biome recommended rules
- **Imports**: Use `import type` for type-only imports; `.js` extensions required for local imports

## Testing

- **Runner**: Vitest with v8 coverage provider
- **Coverage**: 100% threshold on all metrics (statements, branches, functions, lines)
- **Pattern**: TDD (Red → Green → Refactor). Write tests first.
- **Naming**: Prefix IDs (H1, F1, Z1, etc.) for cross-referencing with requirements
- **Integration tests**: Use `app.request()` for end-to-end Hono pipeline testing

## Key Conventions

- **Extensions spread order**: `{ ...extensions, ...standard }` — standard fields always win over extensions (RFC 9457 Section 3.1)
- **Subpath exports**: Each integration is a separate entry point (`./zod`, `./valibot`, `./openapi`, `./standard-schema`)
- **External deps**: All peer dependencies must be listed in `tsup.config.ts` `external` array to prevent bundling
- **No runtime dependencies**: Only `hono` as peer dependency. All integrations are optional peer deps.

## Workflow

1. Create GitHub Issue
2. Create feature branch from main
3. TDD: write failing tests → implement → refactor
4. Verify: `pnpm lint && pnpm typecheck && pnpm test`
5. Create PR with `gh pr create`
6. Auto-merge with `gh pr merge --squash --auto`

## Release

- Changesets for versioning (`pnpm changeset`)
- GitHub Actions auto-creates "Version Packages" PR on main push
- Merging that PR triggers `pnpm release` (build + publish to npm)
- `NODE_AUTH_TOKEN` env var required for npm auth in CI
