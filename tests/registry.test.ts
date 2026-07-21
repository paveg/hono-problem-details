import { describe, expect, expectTypeOf, it } from "vitest";
import type { ProblemDetailsError } from "../src/error.js";
import { createProblemTypeRegistry } from "../src/registry.js";

describe("createProblemTypeRegistry", () => {
	const registry = createProblemTypeRegistry({
		ORDER_CONFLICT: {
			type: "https://api.example.com/problems/order-conflict",
			status: 409,
			title: "Order Conflict",
		},
		RATE_LIMITED: {
			type: "https://api.example.com/problems/rate-limited",
			status: 429,
			title: "Too Many Requests",
		},
		NOT_FOUND: {
			type: "https://api.example.com/problems/not-found",
			status: 404,
			title: "Not Found",
		},
	});

	it("R1: create() returns ProblemDetailsError with registered type", () => {
		const error = registry.create("ORDER_CONFLICT");
		expect(error.problemDetails.type).toBe("https://api.example.com/problems/order-conflict");
		expect(error.problemDetails.status).toBe(409);
		expect(error.problemDetails.title).toBe("Order Conflict");
	});

	it("R2: create() accepts overrides for detail and instance", () => {
		const error = registry.create("NOT_FOUND", {
			detail: "User 123 not found",
			instance: "/users/123",
		});
		expect(error.problemDetails.detail).toBe("User 123 not found");
		expect(error.problemDetails.instance).toBe("/users/123");
	});

	it("R3: create() accepts extensions", () => {
		const error = registry.create("RATE_LIMITED", {
			extensions: { retryAfter: 60 },
		});
		expect(error.problemDetails.extensions).toEqual({ retryAfter: 60 });
	});

	it("R4: create() returns ProblemDetailsError instance", () => {
		const error = registry.create("ORDER_CONFLICT");
		expect(error).toBeInstanceOf(Error);
		expect(error.name).toBe("ProblemDetailsError");
	});

	it("R5: getResponse() works on registry-created errors", async () => {
		const error = registry.create("NOT_FOUND", { detail: "Item missing" });
		const res = error.getResponse();
		expect(res.status).toBe(404);
		expect(res.headers.get("Content-Type")).toBe("application/problem+json; charset=utf-8");

		const body = await res.json();
		expect(body.type).toBe("https://api.example.com/problems/not-found");
		expect(body.detail).toBe("Item missing");
	});

	it("R6: get() returns the registered type definition", () => {
		const def = registry.get("ORDER_CONFLICT");
		expect(def).toEqual({
			type: "https://api.example.com/problems/order-conflict",
			status: 409,
			title: "Order Conflict",
		});
	});

	it("R7: types() returns all registered type keys", () => {
		const keys = registry.types();
		expect(keys).toEqual(["ORDER_CONFLICT", "RATE_LIMITED", "NOT_FOUND"]);
	});

	it("R8: create() returns correct type", () => {
		const error = registry.create("ORDER_CONFLICT");
		expectTypeOf(error).toMatchTypeOf<ProblemDetailsError>();
	});

	it("R9: empty registry returns empty types array", () => {
		const empty = createProblemTypeRegistry({});
		expect(empty.types()).toEqual([]);
	});

	it("R10: create() without options omits detail and instance", () => {
		const error = registry.create("ORDER_CONFLICT");
		expect(error.problemDetails.detail).toBeUndefined();
		expect(error.problemDetails.instance).toBeUndefined();
		expect(error.problemDetails.extensions).toBeUndefined();
	});

	it("R11: without autoCode, no code extension is added", () => {
		const error = registry.create("ORDER_CONFLICT");
		expect(error.problemDetails.extensions).toBeUndefined();
	});
});

describe("createProblemTypeRegistry with autoCode", () => {
	const registry = createProblemTypeRegistry(
		{
			ORDER_CONFLICT: {
				type: "https://api.example.com/problems/order-conflict",
				status: 409,
				title: "Order Conflict",
			},
			RATE_LIMITED: {
				type: "https://api.example.com/problems/rate-limited",
				status: 429,
				title: "Too Many Requests",
			},
			V2_AUTH: {
				type: "https://api.example.com/problems/v2-auth",
				status: 401,
				title: "V2 Auth Required",
			},
			AUTH__TOKEN_EXPIRED: {
				type: "https://api.example.com/problems/auth-token-expired",
				status: 401,
				title: "Token Expired",
			},
			LEGACY_ERROR: {
				type: "https://api.example.com/problems/legacy-error",
				status: 400,
				title: "Legacy Error",
				code: "legacy/error_code",
			},
			_AUTH_: {
				type: "https://api.example.com/problems/auth",
				status: 401,
				title: "Auth Required",
			},
			ÄUTH_KEY: {
				type: "https://api.example.com/problems/auth-key",
				status: 401,
				title: "Non-ASCII Key",
			},
		},
		{ autoCode: true },
	);

	it("R12: autoCode derives kebab-case code from SCREAMING_SNAKE key", () => {
		const error = registry.create("ORDER_CONFLICT");
		expect(error.problemDetails.extensions).toEqual({ code: "order-conflict" });
	});

	it("R13: autoCode-derived code merges alongside other extensions", () => {
		const error = registry.create("RATE_LIMITED", { extensions: { retryAfter: 60 } });
		expect(error.problemDetails.extensions).toEqual({ code: "rate-limited", retryAfter: 60 });
	});

	it("R14: autoCode keeps digits attached to the preceding segment", () => {
		const error = registry.create("V2_AUTH");
		expect(error.problemDetails.extensions).toEqual({ code: "v2-auth" });
	});

	it("R15: autoCode collapses consecutive underscores to a single hyphen", () => {
		const error = registry.create("AUTH__TOKEN_EXPIRED");
		expect(error.problemDetails.extensions).toEqual({ code: "auth-token-expired" });
	});

	it("R15b: autoCode strips leading and trailing underscores", () => {
		const error = registry.create("_AUTH_");
		expect(error.problemDetails.extensions).toEqual({ code: "auth" });
	});

	it("R15c: autoCode leaves non-ASCII characters unchanged", () => {
		const error = registry.create("ÄUTH_KEY");
		expect(error.problemDetails.extensions).toEqual({ code: "Äuth-key" });
	});

	it("R16: explicit code on the registry definition overrides auto-derivation", () => {
		const error = registry.create("LEGACY_ERROR");
		expect(error.problemDetails.extensions).toEqual({ code: "legacy/error_code" });
	});

	it("R17: user-supplied extensions.code on create() overrides the derived value", () => {
		const error = registry.create("ORDER_CONFLICT", { extensions: { code: "custom-code" } });
		expect(error.problemDetails.extensions).toEqual({ code: "custom-code" });
	});

	it("R18: user-supplied extensions.code overrides an explicit registry code", () => {
		const error = registry.create("LEGACY_ERROR", { extensions: { code: "override" } });
		expect(error.problemDetails.extensions).toEqual({ code: "override" });
	});
});
