---
"hono-problem-details": patch
---

Drop source maps from the published package. The build previously set `sourcemap: true` while excluding `.map` files via `files`, which left dangling `//# sourceMappingURL` comments pointing at maps that were never shipped. `sourcemap` is now `false`, so no source-map comments or files are emitted. Aligns with the minimal-footprint peers (hono, zod, valibot). No runtime behavior change.
