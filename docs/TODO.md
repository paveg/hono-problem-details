# TODO

## Tooling

- [x] biome (lint + format: tab, double quotes, semicolons, lineWidth 100)
- [x] TypeScript (strict mode, ES2022, bundler moduleResolution)
- [x] vitest (test runner + v8 coverage provider)
- [x] tsup (ESM + CJS dual output, sourcemap, dts)
- [x] changesets (versioning & release, @changesets/changelog-github)
- [x] lefthook (pre-commit: biome check on staged files)
- [x] pnpm@10.14.0 (pinned via packageManager field)

## Phase 1: Core

### 1.1 Project Setup

- [x] package.json — type: module, engines: node>=20, sideEffects: false
- [x] tsconfig.json — strict, ES2022, bundler resolution, declaration + declarationMap + sourceMap
- [x] biome.json — recommended rules, tab indent, 100 char, double quotes, semicolons always
- [x] vitest.config.ts — v8 provider, coverage 100% thresholds (statements/branches/functions/lines)
- [x] tsup.config.ts — entry points (index, integrations/zod, integrations/valibot), ESM+CJS, dts, clean, sourcemap, external: hono
- [x] .editorconfig — tab indent, lf, utf-8, trim trailing whitespace
- [x] .gitignore — node_modules, dist, coverage, *.tsbuildinfo, .DS_Store
- [x] lefthook.yml — pre-commit: biome check on staged *.{js,ts,jsx,tsx,json}
- [x] publishConfig — access: public, provenance: true

### 1.2 CI / CD

- [x] `.github/workflows/ci.yml`
  - push to main + pull_request to main
  - Node.js matrix: 20, 22, 24
  - Steps: checkout → setup pnpm → setup node (cache) → install --frozen-lockfile → lint → typecheck → vitest run --coverage → build
  - `ci-pass` guard job (needs: ci, fails if ci fails)
- [x] `.github/workflows/release.yml`
  - push to main, concurrency control
  - permissions: contents/pull-requests/id-token write
  - changesets/action@v1 for auto release PR creation + npm publish
  - secrets: GITHUB_TOKEN, NPM_TOKEN
- [ ] GitHub branch ruleset — require ci-pass on main branch

### 1.3 Coverage Target

- [x] vitest.config.ts with 100% thresholds on all metrics:
  - statements: 100
  - branches: 100
  - functions: 100
  - lines: 100
- [x] Coverage include: `src/**/*.ts`
- [x] Coverage exclude: `src/index.ts`, `src/types.ts` (re-exports / type-only files)

### 1.4 Type Definitions

- [x] `src/types.ts` — ProblemDetails, ProblemDetailsInput, ProblemDetailsHandlerOptions
- [ ] Tests: type inference verification (tsd or vitest type tests)

### 1.5 Status Code Mapping

TDD: write `tests/status.test.ts` first

- [ ] `src/status.ts` — statusToPhrase(), statusToSlug()
- [ ] Tests:
  - Common status codes (400, 401, 403, 404, 409, 422, 429, 500, 502, 503) → phrase
  - Unknown status code → undefined
  - Slug generation (422 → "unprocessable-content")

### 1.6 ProblemDetailsError

TDD: write `tests/factory.test.ts` first

- [ ] `src/error.ts` — ProblemDetailsError class
- [ ] `src/factory.ts` — problemDetails() factory function
- [ ] Tests:
  | # | Test Case | Expected | Priority |
  |---|-----------|----------|----------|
  | F1 | Minimal input (status only) | type="about:blank", title=auto, detail=undefined | **Required** |
  | F2 | All fields specified | specified values used as-is | **Required** |
  | F3 | With extension members | extensions flattened to top level | **Required** |
  | F4 | getResponse() | Content-Type: application/problem+json, JSON body | **Required** |
  | F5 | status matches response status | RFC 9457 MUST requirement | **Required** |
  | F6 | Extends Error | instanceof Error is true | **Required** |

### 1.7 Error Handler

TDD: write `tests/handler.test.ts` first

- [ ] `src/handler.ts` — problemDetailsHandler()
- [ ] Tests:
  | # | Test Case | Expected | Priority |
  |---|-----------|----------|----------|
  | H1 | ProblemDetailsError thrown | Problem Details response as-is | **Required** |
  | H2 | HTTPException thrown | Auto-convert to Problem Details | **Required** |
  | H3 | Generic Error thrown | 500 + Problem Details | **Required** |
  | H4 | typePrefix set | type = `{prefix}/{slug}` | **Required** |
  | H5 | typePrefix not set | type = "about:blank" | **Required** |
  | H6 | includeStack: true | stack trace in detail | Medium |
  | H7 | includeStack: false (default) | no stack trace in detail | **Required** |
  | H8 | mapError custom mapping | custom result returned | **Required** |
  | H9 | mapError returns undefined | fallback to default handling | **Required** |
  | H10 | Content-Type header | "application/problem+json" | **Required** |
  | H11 | c.get('problemDetails') is set | accessible from context | Medium |

## Phase 2: Validator Integration

### 2.1 zodProblemHook

TDD: write `tests/integrations/zod.test.ts` first

- [ ] `src/integrations/zod.ts` — zodProblemHook()
- [ ] Tests:
  | # | Test Case | Expected | Priority |
  |---|-----------|----------|----------|
  | Z1 | Validation success | hook returns nothing (void) | **Required** |
  | Z2 | Single field error | 422 + errors array with 1 item | **Required** |
  | Z3 | Multiple field errors | 422 + errors array with multiple items | **Required** |
  | Z4 | Nested field error | field as "address.city" (dot-separated) | **Required** |
  | Z5 | Content-Type | "application/problem+json" | **Required** |
  | Z6 | errors extension member structure | { field, message, code } | **Required** |
  | Z7 | Custom title/detail options | zodProblemHook({ title: '...' }) overrides | Medium |

### 2.2 valibotProblemHook

TDD: write `tests/integrations/valibot.test.ts` first

- [ ] `src/integrations/valibot.ts` — valibotProblemHook()
- [ ] Subpath export: `./valibot`
- [ ] Tests:
  | # | Test Case | Expected | Priority |
  |---|-----------|----------|----------|
  | V1 | Validation success | hook returns nothing (void) | **Required** |
  | V2 | Single field error | 422 + errors array with 1 item | **Required** |
  | V3 | Multiple field errors | 422 + errors array with multiple items | **Required** |
  | V4 | Nested field error | field as "address.city" (dot-separated) | **Required** |
  | V5 | Content-Type | "application/problem+json" | **Required** |
  | V6 | errors extension member structure | { field, message, code } | **Required** |
  | V7 | Custom title/detail options | valibotProblemHook({ title: '...' }) overrides | Medium |

## Phase 3: Community & Docs

### 3.1 Community Files

- [ ] CONTRIBUTING.md — dev setup, commands, TDD workflow, code style (biome), changeset usage
- [ ] CODE_OF_CONDUCT.md — Contributor Covenant v2.1
- [ ] SECURITY.md — supported versions, report via GitHub Security Advisories, response timeline
- [ ] LICENSE (MIT)

### 3.2 GitHub Templates

- [ ] `.github/FUNDING.yml`
- [ ] `.github/ISSUE_TEMPLATE/bug_report.yml` — version, Hono version, runtime, reproduction steps
- [ ] `.github/ISSUE_TEMPLATE/feature_request.yml` — problem, proposed solution, alternatives
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` — Summary, Related Issues, checklist (tests/typecheck/lint/changeset)

### 3.3 Packaging

- [ ] README.md (English) — RFC 9457 compliance, usage examples, Zod/Valibot integration
- [ ] Subpath exports (`.` → core, `./zod` → Zod, `./valibot` → Valibot)
- [ ] npm publish + JSR publish
- [ ] CHANGELOG.md — auto-generated by changesets

## Phase 4: Publish & Integrate

### 4.1 npm / JSR Publish

- [ ] npm publish (via changesets)
- [ ] JSR publish

### 4.2 Hono Ecosystem

- [ ] Comment on [honojs/middleware #579](https://github.com/honojs/middleware/issues/579)
- [ ] Submit third-party listing PR to honojs/middleware

### 4.3 Existing Library Integration

- [ ] PR to migrate hono-idempotency errors.ts to hono-problem-details
- [ ] PR to migrate hono-webhook-verify errors.ts to hono-problem-details

## Stretch Goals

- [ ] OpenAPI integration (`hono-problem-details/openapi`) — auto-generate error schemas for @hono/zod-openapi
- [ ] Standard Schema integration (`hono-problem-details/standard-schema`) — ArkType support
- [ ] i18n — title/detail localization
- [ ] Problem type registry — helpers for defining/managing custom problem types
- [ ] Express adapter — alternative to express-http-problem-details
