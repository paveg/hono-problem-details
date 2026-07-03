# hono-problem-details

RFC 9457 Problem Details middleware for Hono. Zero runtime dependencies: hono is the
only required peer; every integration dependency is an optional peer.

## Layout

- src/ — core: error.ts, factory.ts, handler.ts, registry.ts, status.ts, types.ts, utils.ts
- src/integrations/ — optional integrations, one published subpath export per file
  (./zod, ./valibot, ./openapi, ./standard-schema); validation.ts and opentelemetry.ts
  are internal
- tests/ — vitest suites; tests/type-compat/ is a tsc-only TS-version compat guard
- docs/adr/ — architecture decision records; read before changing serialization,
  openapi schema construction, or the localize contract

## Commands

- pnpm test — vitest run (pnpm test:watch for watch mode)
- pnpm lint / pnpm lint:fix — biome check
- pnpm typecheck — tsc --noEmit
- pnpm knip — unused code/dependency detection (runs in CI)
- pnpm build — tsup, ESM + CJS dual output
- pnpm test:compat — type-compat check against dist (run pnpm build first)
- pnpm bench — vitest bench

## Code Style

- Biome: tabs, double quotes, semicolons always, 100 char line width
- import type for type-only imports; .js extensions required on local imports

## Conventions

- Standard fields always win over extensions (RFC 9457 §3.1). Runtime enforces it by
  spread order ({ ...extensions, ...standard }); the openapi schema mirrors it by
  filtering standard keys from extension shapes. See docs/adr/0002.
- Problem responses always use the PROBLEM_JSON_CONTENT_TYPE constant
  (application/problem+json; charset=utf-8), never a hand-written header.
- New public API: re-export from src/index.ts (knip flags src exports unreachable from
  an entry) and add it to tests/type-compat/core-consumer.ts.
- TDD: write the failing test first. Coverage is 100% on all metrics
  (vitest.config.ts thresholds; only src/index.ts and src/types.ts are excluded).
- Test names carry prefix IDs (H1, F1, Z1, ...) for cross-referencing requirements;
  end-to-end tests go through app.request() so the full Hono pipeline runs.
- Pre-1.0 versioning: breaking changes ship as minor bumps. Every consumer-visible
  change needs a changeset (pnpm changeset).

## Workflow

1. GitHub Issue, then feature branch from main (feat/, fix/, chore/, docs/)
2. TDD: failing tests, implement, refactor
3. Verify: pnpm lint && pnpm typecheck && pnpm test
4. PR via gh pr create; merge with gh pr merge --squash --auto
5. Public artifacts (PR titles/bodies, commits, issues) are written in English

## Release

Fully automated via changesets: merging to main creates or updates a Version Packages
PR; merging that PR publishes to npm through OIDC Trusted Publishing. No manual
publish steps and no npm token.
