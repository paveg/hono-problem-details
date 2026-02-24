# TODO

## Tooling

- [ ] biome (lint + format: tab, double quotes, semicolons, lineWidth 100)
- [ ] TypeScript (strict mode, ES2022, bundler moduleResolution)
- [ ] vitest (テストランナー + v8 coverage provider)
- [ ] tsup (ESM + CJS dual output, sourcemap, dts)
- [ ] changesets (バージョニング・リリース、@changesets/changelog-github)
- [ ] lefthook (pre-commit: biome check on staged files)
- [ ] pnpm@10.14.0 (packageManager フィールド固定)

## Phase 1: Core

### 1.1 プロジェクトセットアップ

- [ ] package.json — type: module, engines: node>=20, sideEffects: false
- [ ] tsconfig.json — strict, ES2022, bundler resolution, declaration + declarationMap + sourceMap
- [ ] biome.json — recommended rules, tab indent, 100 char, double quotes, semicolons always
- [ ] vitest.config.ts — v8 provider, coverage 100% thresholds (statements/branches/functions/lines)
- [ ] tsup.config.ts — entry points (index, integrations/zod), ESM+CJS, dts, clean, sourcemap, external: hono
- [ ] .editorconfig — tab indent, lf, utf-8, trim trailing whitespace
- [ ] .gitignore — node_modules, dist, coverage, *.tsbuildinfo, .DS_Store
- [ ] lefthook.yml — pre-commit: biome check on staged *.{js,ts,jsx,tsx,json}
- [ ] publishConfig — access: public, provenance: true

### 1.2 CI / CD

- [ ] `.github/workflows/ci.yml`
  - push to main + pull_request to main
  - Node.js matrix: 20, 22, 24
  - Steps: checkout → setup pnpm → setup node (cache) → install --frozen-lockfile → lint → typecheck → vitest run --coverage → build
  - `ci-pass` guard job (needs: ci, fails if ci fails)
- [ ] `.github/workflows/release.yml`
  - push to main, concurrency 制御
  - permissions: contents/pull-requests/id-token write
  - changesets/action@v1 で自動リリース PR 作成 + npm publish
  - secrets: GITHUB_TOKEN, NPM_TOKEN
- [ ] GitHub branch ruleset — main ブランチに ci-pass required

### 1.3 Coverage 目標

- [ ] vitest.config.ts で全メトリクス 100% threshold を設定:
  - statements: 100
  - branches: 100
  - functions: 100
  - lines: 100
- [ ] coverage 対象: `src/**/*.ts`
- [ ] coverage 除外: `src/index.ts`, `src/types.ts` (re-export / 型定義のみ)

### 1.4 型定義

- [ ] `src/types.ts` — ProblemDetails, ProblemDetailsInput, ProblemDetailsHandlerOptions
- [ ] テスト: 型推論の検証（tsd または vitest の型テスト）

### 1.5 ステータスコードマッピング

TDD: `tests/status.test.ts` を先に書く

- [ ] `src/status.ts` — statusToPhrase(), statusToSlug()
- [ ] テスト:
  - 主要ステータスコード (400, 401, 403, 404, 409, 422, 429, 500, 502, 503) → フレーズ
  - 未知のステータスコード → undefined
  - slug 生成 (422 → "unprocessable-content")

### 1.6 ProblemDetailsError

TDD: `tests/factory.test.ts` を先に書く

- [ ] `src/error.ts` — ProblemDetailsError クラス
- [ ] `src/factory.ts` — problemDetails() ファクトリ関数
- [ ] テスト:
  | # | テストケース | 期待動作 | 優先度 |
  |---|-------------|---------|-------|
  | F1 | 最小入力 (status のみ) | type="about:blank", title=自動、detail=undefined | **必須** |
  | F2 | 全フィールド指定 | 指定値がそのまま使われる | **必須** |
  | F3 | 拡張メンバー付き | extensions がトップレベルにフラット展開される | **必須** |
  | F4 | getResponse() | Content-Type: application/problem+json, JSON body | **必須** |
  | F5 | status と レスポンスステータスの一致 | RFC 9457 MUST 要件 | **必須** |
  | F6 | Error を継承している | instanceof Error が true | **必須** |

### 1.7 Error Handler

TDD: `tests/handler.test.ts` を先に書く

- [ ] `src/handler.ts` — problemDetailsHandler()
- [ ] テスト:
  | # | テストケース | 期待動作 | 優先度 |
  |---|-------------|---------|-------|
  | H1 | ProblemDetailsError が throw される | そのまま Problem Details レスポンス | **必須** |
  | H2 | HTTPException が throw される | 自動変換して Problem Details | **必須** |
  | H3 | 汎用 Error が throw される | 500 + Problem Details | **必須** |
  | H4 | typePrefix 設定あり | type = `{prefix}/{slug}` | **必須** |
  | H5 | typePrefix 設定なし | type = "about:blank" | **必須** |
  | H6 | includeStack: true | detail に stack trace | 中 |
  | H7 | includeStack: false (default) | detail に stack trace なし | **必須** |
  | H8 | mapError カスタムマッピング | カスタム結果が返る | **必須** |
  | H9 | mapError が undefined を返す | デフォルト処理にフォールバック | **必須** |
  | H10 | Content-Type ヘッダー | "application/problem+json" | **必須** |
  | H11 | c.get('problemDetails') にセットされる | コンテキストでアクセス可能 | 中 |

## Phase 2: Validator Integration

### 2.1 zodProblemHook

TDD: `tests/integrations/zod.test.ts` を先に書く

- [ ] `src/integrations/zod.ts` — zodProblemHook()
- [ ] テスト:
  | # | テストケース | 期待動作 | 優先度 |
  |---|-------------|---------|-------|
  | Z1 | バリデーション成功 | hook は何も返さない (void) | **必須** |
  | Z2 | 単一フィールドエラー | 422 + errors 配列に1件 | **必須** |
  | Z3 | 複数フィールドエラー | 422 + errors 配列に複数件 | **必須** |
  | Z4 | ネストフィールドエラー | field が "address.city" のようにドット区切り | **必須** |
  | Z5 | Content-Type | "application/problem+json" | **必須** |
  | Z6 | errors 拡張メンバーの構造 | { field, message, code } | **必須** |
  | Z7 | カスタム title/detail オプション | zodProblemHook({ title: '...' }) で上書き | 中 |

### 2.2 valibotProblemHook

TDD: `tests/integrations/valibot.test.ts` を先に書く

- [ ] `src/integrations/valibot.ts` — valibotProblemHook()
- [ ] サブパスエクスポート: `./valibot`
- [ ] テスト:
  | # | テストケース | 期待動作 | 優先度 |
  |---|-------------|---------|-------|
  | V1 | バリデーション成功 | hook は何も返さない (void) | **必須** |
  | V2 | 単一フィールドエラー | 422 + errors 配列に1件 | **必須** |
  | V3 | 複数フィールドエラー | 422 + errors 配列に複数件 | **必須** |
  | V4 | ネストフィールドエラー | field が "address.city" のようにドット区切り | **必須** |
  | V5 | Content-Type | "application/problem+json" | **必須** |
  | V6 | errors 拡張メンバーの構造 | { field, message, code } | **必須** |
  | V7 | カスタム title/detail オプション | valibotProblemHook({ title: '...' }) で上書き | 中 |

## Phase 3: Community & Docs

### 3.1 コミュニティファイル

- [ ] CONTRIBUTING.md — 開発セットアップ、コマンド一覧、TDD ワークフロー、コードスタイル(biome)、changeset の使い方
- [ ] CODE_OF_CONDUCT.md — Contributor Covenant v2.1
- [ ] SECURITY.md — サポートバージョン、GitHub Security Advisories で報告、対応タイムライン
- [ ] LICENSE (MIT)

### 3.2 GitHub テンプレート

- [ ] `.github/FUNDING.yml`
- [ ] `.github/ISSUE_TEMPLATE/bug_report.yml` — バージョン、Hono バージョン、ランタイム、再現手順
- [ ] `.github/ISSUE_TEMPLATE/feature_request.yml` — 課題、提案、代替案
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` — Summary、Related Issues、チェックリスト (tests/typecheck/lint/changeset)

### 3.3 パッケージング

- [ ] README.md (English) — RFC 9457 compliance, usage examples, Zod integration
- [ ] サブパスエクスポート設定 (`.` → core, `./zod` → Zod 統合)
- [ ] npm publish + JSR publish
- [ ] CHANGELOG.md — changesets が自動生成

## Phase 4: Publish & Integrate

### 4.1 npm / JSR 公開

- [ ] npm publish (changesets 経由)
- [ ] JSR publish

### 4.2 Hono エコシステム

- [ ] [honojs/middleware #579](https://github.com/honojs/middleware/issues/579) にコメント
- [ ] honojs/middleware リポジトリに third-party 掲載 PR

### 4.3 既存ライブラリとの統合

- [ ] hono-idempotency の errors.ts を hono-problem-details に移行する PR
- [ ] hono-webhook-verify の errors.ts を hono-problem-details に移行する PR

## Stretch Goals

- [ ] OpenAPI 統合 (`hono-problem-details/openapi`) — @hono/zod-openapi のエラースキーマ自動生成
- [ ] Standard Schema 統合 (`hono-problem-details/standard-schema`) — ArkType 等の追加対応
- [ ] i18n — title/detail のローカリゼーション
- [ ] Problem type registry — カスタム problem type の定義・管理ヘルパー
- [ ] Express アダプタ — express-http-problem-details の代替
