---
"hono-problem-details": minor
---

Add `autoInstance` handler option and widen `localize` return type to accept partial patches.

- **`problemDetailsHandler({ autoInstance: true })`** populates `instance` from `c.req.path`
  when the thrown problem did not specify one. Opt-in to avoid silently changing response
  shape for existing consumers; explicit `instance` values always win.
- **`localize` callback** may now return `Partial<ProblemDetails> | undefined` instead of
  the full object. This aligns the TypeScript type with the existing runtime behaviour
  (`{ ...pd, ...localize(pd, c) }`). Returning the full object still works; existing
  callbacks compile unchanged.
- README: documents the `title`-from-status auto-fill (unchanged runtime behaviour) and the
  new `autoInstance` shortcut so callers stop hand-writing `title`/`instance` for stock
  HTTP semantics.
