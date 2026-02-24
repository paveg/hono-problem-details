# Add Integration

Guide for adding a new validator/framework integration to hono-problem-details.

## Steps

1. **Create source file**: `src/integrations/<name>.ts`
   - Export a hook function that returns a Hono-compatible hook/middleware
   - Return `Response` with `application/problem+json` Content-Type
   - Use status 422 for validation errors
   - Include `errors` array in response body

2. **Create test file**: `tests/integrations/<name>.test.ts`
   - Test success passthrough
   - Test single/multiple field errors
   - Test nested field paths (dot-separated)
   - Test Content-Type header
   - Test custom title/detail options
   - Test root-level validation (empty path)

3. **Update package.json**:
   - Add subpath export under `"exports"` (both import and require)
   - Add framework package to `peerDependencies` (via `peerDependenciesMeta` as optional)
   - Add to `devDependencies`

4. **Update tsup.config.ts**:
   - Add entry point to `entry` object
   - Add framework package to `external` array

5. **Update jsr.json**: Add export mapping

6. **Update README.md**: Add usage example section

7. **Verify**: `pnpm lint && pnpm typecheck && pnpm vitest run --coverage`

## Template

```typescript
import type { Context } from "hono";

export interface <Name>ProblemHookOptions {
	title?: string;
	detail?: string;
}

export function <name>ProblemHook(options?: <Name>ProblemHookOptions) {
	return (result: <ResultType>, c: Context) => {
		if (result.success) return;
		const body = {
			type: "about:blank",
			status: 422,
			title: options?.title ?? "Validation Error",
			detail: options?.detail ?? "Request validation failed",
			errors: formatErrors(result.error),
		};
		return new Response(JSON.stringify(body), {
			status: 422,
			headers: { "Content-Type": "application/problem+json" },
		});
	};
}
```
