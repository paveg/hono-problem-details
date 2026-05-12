/**
 * Regression tests for issue #133 — see ADR-0004.
 *
 * The `./openapi` integration must defer schema construction until the consumer
 * calls `getProblemDetailsSchema()`. Constructing at module-top-level runs the
 * chained `.openapi(...)` calls before the consumer's bundle has finished
 * resolving and patching `zod`, which throws under multi-zod-instance bundles
 * (Cloudflare Workers via wrangler/esbuild, pnpm strict hoisting, etc.).
 *
 * NOTE: `vi.resetModules()` clears the module registry so subsequent dynamic
 * imports re-evaluate. To attach spies to the prototype that the
 * freshly-imported module will actually use, we must import `z` dynamically
 * AFTER the reset — a top-level `import { z } from "@hono/zod-openapi"`
 * would hold a stale reference to the pre-reset prototype, and the spy would
 * never intercept calls made by the fresh module instance.
 */
import { describe, expect, it, vi } from "vitest";

describe("openapi factory — lazy construction (ADR-0004)", () => {
	it("L1: importing the module does not invoke `.openapi()`", async () => {
		vi.resetModules();
		const { z } = await import("@hono/zod-openapi");
		const spy = vi.spyOn(z.ZodType.prototype, "openapi");
		try {
			await import("../../src/integrations/openapi.js");
			expect(spy).not.toHaveBeenCalled();
		} finally {
			spy.mockRestore();
		}
	});

	it("L2: `getProblemDetailsSchema()` triggers `.openapi()` invocations", async () => {
		vi.resetModules();
		const { z } = await import("@hono/zod-openapi");
		const spy = vi.spyOn(z.ZodType.prototype, "openapi");
		try {
			const mod = await import("../../src/integrations/openapi.js");
			expect(spy).not.toHaveBeenCalled();
			mod.getProblemDetailsSchema();
			expect(spy).toHaveBeenCalled();
		} finally {
			spy.mockRestore();
		}
	});

	it("L3: `getProblemDetailsSchema()` is memoized (returns same instance on repeat calls)", async () => {
		vi.resetModules();
		const mod = await import("../../src/integrations/openapi.js");
		const a = mod.getProblemDetailsSchema();
		const b = mod.getProblemDetailsSchema();
		expect(a).toBe(b);
	});

	it("L4: `problemDetailsResponse()` default schema is the memoized factory result", async () => {
		vi.resetModules();
		const mod = await import("../../src/integrations/openapi.js");
		const response = mod.problemDetailsResponse(500);
		expect(response.content["application/problem+json"].schema).toBe(mod.getProblemDetailsSchema());
	});

	it("L5: `problemDetailsResponse()` invocation alone does not call `.openapi()` more than once per memoized build", async () => {
		vi.resetModules();
		const { z } = await import("@hono/zod-openapi");
		const mod = await import("../../src/integrations/openapi.js");
		// First call builds (and registers metadata via .openapi)
		mod.problemDetailsResponse(400);
		// Spy AFTER first build — subsequent calls must not rebuild
		const spy = vi.spyOn(z.ZodType.prototype, "openapi");
		try {
			mod.problemDetailsResponse(500);
			mod.problemDetailsResponse(422);
			expect(spy).not.toHaveBeenCalled();
		} finally {
			spy.mockRestore();
		}
	});
});
