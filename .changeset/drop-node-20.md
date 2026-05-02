---
"hono-problem-details": minor
---

Drop Node.js 20 support; minimum is now Node 22.

Node 20 reached end-of-life in April 2026 (https://nodejs.org/en/about/previous-releases). The `engines.node` floor has been raised to `>=22`, and the CI matrix now tests against Node 22 and 24 only.

If you are still on Node 20, pin `hono-problem-details` to `<0.6.0` until you can upgrade. The runtime API is unchanged.
