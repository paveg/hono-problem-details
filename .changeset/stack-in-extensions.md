---
"hono-problem-details": minor
---

Move `includeStack` output to `extensions.stack`; always set a user-safe `detail` on 500 responses.

**Behaviour change** on unhandled `Error` → 500 responses from `problemDetailsHandler`:

- `detail` is now **always** `"An unexpected error occurred"` (a generic, UI-safe string).
  Previously, the raw `error.stack` was written into `detail` when `includeStack: true`.
- When `includeStack: true`, the stack trace is emitted as a top-level `stack` extension
  member per RFC 9457 §3.1 flattening. Consumers that want it read `body.stack`; clients
  that only render `detail` now receive a safe, constant message.
- When `includeStack: false` (default), the 500 body contains `detail` and nothing else
  — no stack, no leaked error message.

**Why**: RFC 9457 calls `detail` a "human-readable explanation specific to this
occurrence". Many clients (dashboards, error pages, toast UIs, log sinks) render it
verbatim, so leaking a server stack trace via `detail` turns a dev-only flag into a
production foot-gun. `extensions` fields are, by convention, inspected only by consumers
that opt in, so the stack is gated behind explicit client intent.

**Migration**:

- Consumers of 500 bodies should read `body.stack` instead of `body.detail` when
  `includeStack` is on.
- `includeStack` should remain disabled in production. A common safe pattern:

  ```ts
  problemDetailsHandler({
    includeStack: process.env.NODE_ENV !== "production",
  });
  ```
