---
"hono-problem-details": patch
---

Fix extension members overwriting standard RFC 9457 fields

- Standard fields (type, status, title, detail, instance) now always take precedence over extension keys with the same name
- Add 12 boundary tests for edge cases
