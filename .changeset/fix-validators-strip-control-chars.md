---
"hono-problem-details": patch
---

Validator hooks (`zod`, `valibot`, `standard-schema`) now strip C0 control
characters (`\x00`–`\x1f`) and DEL (`\x7f`) from `field` and `message` in the
`errors[]` array before serialization. This prevents log-line spoofing via
BEL / backspace / similar controls embedded in user-supplied field names.
Bidi/format controls (`U+202E` etc.) are intentionally left intact to avoid
breaking legitimate i18n content.
