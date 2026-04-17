---
"hono-problem-details": patch
---

Raise `hono` peer-dependency floor from `>=4.0.0` to `>=4.12.14`.

`hono@<4.12.14` is affected by an HTML-injection advisory in `hono/jsx` SSR (Dependabot alert #23, [GHSA](https://github.com/honojs/hono/security/advisories)). This library does not use `hono/jsx` and is not itself vulnerable, but the floor bump nudges consumers onto a patched `hono` so downstream apps that do use JSX SSR are not left on an unsafe version via transitive install resolution.

Consumers pinned to `hono@<4.12.14` will see a peer-dep warning (pnpm/yarn) or resolution error (npm `--strict-peer-deps`). Upgrade `hono` to `^4.12.14` or later.
