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
});
