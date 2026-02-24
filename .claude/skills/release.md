# Release Process

How to create and publish a new version.

## Creating a Changeset

```bash
pnpm changeset
```

Select `hono-problem-details`, choose semver bump type (patch/minor/major), and write a summary.

The changeset file will be created in `.changeset/`.

## Automated Release (via GitHub Actions)

1. Push changeset to `main` (via PR)
2. Release workflow detects changeset and creates a "Version Packages" PR
3. Review the PR — it updates `package.json` version and generates `CHANGELOG.md`
4. Merge the "Version Packages" PR
5. Release workflow runs `pnpm release` (build + `changeset publish`)
6. Package published to npm with provenance

## Manual Release (local)

Only needed if CI is broken or for first-time publish:

```bash
pnpm build
npm publish --access public --provenance=false
```

Note: `--provenance=false` is required locally (provenance only works in GitHub Actions).

## Requirements

- `NPM_TOKEN` secret set in GitHub Actions (Automation token type recommended)
- `NODE_AUTH_TOKEN` env var used by `setup-node` for `.npmrc` auth
- `repository.url` field in `package.json` must match GitHub repo (required for provenance)
