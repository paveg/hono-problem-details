# ADR-0002: Flatten extension members at top level with standard-field precedence

## Status

Accepted

## Context

RFC 9457 §3.2 defines extension members as additional keys on a Problem Details object
beyond the five standard fields (`type`, `status`, `title`, `detail`, `instance`). The spec
requires that extension members appear at the top level of the JSON object, not nested
under a separate key.

The middleware exposes extensions via a dedicated `extensions` field on the
`ProblemDetailsInput` interface to avoid a typing hazard: if users wrote extensions
directly alongside standard fields on a single object, the TypeScript type for extensions
would need to be `Record<string, unknown>` merged with the standard fields — inference
would collapse and accidental overrides of `status` / `title` would compile silently.

This creates a serialization problem: how do we flatten
`{ type, status, ..., extensions: { foo } }` into `{ type, status, ..., foo }` on the wire,
and what happens if an extension key collides with a standard field name
(e.g. `extensions: { status: 999 }`)?

## Decision

`buildProblemResponse` in `src/utils.ts` performs the flatten with this spread order:

```ts
const { extensions, ...standard } = pd;
const body = { ...sanitizeExtensions(extensions), ...standard };
```

Standard fields are spread **after** extensions, so they always win when keys collide.
Extension keys that match a standard field name are silently dropped from the output.
This matches RFC 9457 §3.1's requirement that the five standard members have fixed
semantics — users cannot override them through the extensions channel.

Additionally, `sanitizeExtensions` strips the prototype pollution keys `__proto__`,
`constructor`, and `prototype` before the spread, to prevent downstream JSON consumers
that use `Object.assign` or spread on the parsed body from being affected.

## Consequences

**Positive**:

- Typed `ProblemDetailsInput.extensions` keeps inference clean for the caller
- RFC 9457 §3.1 compliance is enforced mechanically by the spread order — no runtime
  check required
- Prototype pollution keys are dropped at the serialization boundary, not pushed onto
  consumers
- The behavior is testable with a single assertion: `extensions: { status: 999 }` must
  not change the response status

**Negative**:

- Silent override suppression may surprise users who expect `extensions: { status: 999 }`
  to either error or take effect
- Prototype key stripping is not logged, so malformed input is hidden from operators
- Users who want a truly nested `extensions` field in the response body (non-RFC-compliant)
  have no escape hatch
