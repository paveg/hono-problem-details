# src/integrations

- Any new public export on a subpath (a new integration or an addition to an existing
  one) must also be imported in tests/type-compat/core-consumer.ts, from ../../dist —
  that file is what CI's TypeScript 5.0-6.0 compat matrix type-checks, so an export
  missing there ships unguarded. Verify with pnpm build && pnpm test:compat, plus
  pnpm knip.
- opentelemetry.ts intentionally never imports @opentelemetry/api: the API is typed
  structurally as OtelApiLike (src/types.ts) so the dependency stays optional, and it
  is not a subpath export — consumers reach it through the handler's otelApi option.
  tests/type-compat/otel-api-compat.ts guards compatibility with the real API.
