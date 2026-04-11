---
"hono-problem-details": patch
---

`clampHttpStatus` now requires an integer via `Number.isInteger`. Previously
strings, floats, and BigInts could slip through the 200–599 range check via
JavaScript type coercion, producing undefined behavior in stricter fetch
runtimes. Non-integer or out-of-range values now fall back to 500.
