import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { zodProblemHook } from "../../src/integrations/zod.js";

function createApp(hookOptions?: Parameters<typeof zodProblemHook>[0]) {
	const app = new Hono();
	const schema = z.object({
		email: z.string().email(),
		age: z.number().positive(),
		address: z
			.object({
				city: z.string().min(1),
			})
			.optional(),
	});
	app.post("/users", zValidator("json", schema, zodProblemHook(hookOptions)), (c) => {
		return c.json({ ok: true });
	});
	return app;
}

describe("zodProblemHook", () => {
	it("Z1: passes through on validation success", async () => {
		const app = createApp();
		const res = await app.request("/users", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "test@example.com", age: 25 }),
		});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.ok).toBe(true);
	});

	it("Z2: returns 422 with single field error", async () => {
		const app = createApp();
		const res = await app.request("/users", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "invalid", age: 25 }),
		});
		expect(res.status).toBe(422);
		const body = await res.json();
		expect(body.status).toBe(422);
		expect(body.errors).toHaveLength(1);
		expect(body.errors[0].field).toBe("email");
	});

	it("Z3: returns 422 with multiple field errors", async () => {
		const app = createApp();
		const res = await app.request("/users", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "invalid", age: -1 }),
		});
		expect(res.status).toBe(422);
		const body = await res.json();
		expect(body.errors.length).toBeGreaterThanOrEqual(2);
	});

	it("Z4: uses dot-separated path for nested field errors", async () => {
		const app = createApp();
		const res = await app.request("/users", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "test@example.com", age: 25, address: { city: "" } }),
		});
		expect(res.status).toBe(422);
		const body = await res.json();
		const cityError = body.errors.find((e: { field: string }) => e.field === "address.city");
		expect(cityError).toBeDefined();
	});

	it("Z5: sets Content-Type to application/problem+json", async () => {
		const app = createApp();
		const res = await app.request("/users", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "invalid", age: 25 }),
		});
		expect(res.headers.get("Content-Type")).toContain("application/problem+json");
	});

	it("Z6: errors have { field, message, code } structure", async () => {
		const app = createApp();
		const res = await app.request("/users", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "invalid", age: 25 }),
		});
		const body = await res.json();
		const error = body.errors[0];
		expect(error).toHaveProperty("field");
		expect(error).toHaveProperty("message");
		expect(error).toHaveProperty("code");
	});

	it("Z7: allows custom title and detail via options", async () => {
		const app = createApp({
			title: "Custom Validation Error",
			detail: "Please check your input",
		});
		const res = await app.request("/users", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "invalid", age: 25 }),
		});
		const body = await res.json();
		expect(body.title).toBe("Custom Validation Error");
		expect(body.detail).toBe("Please check your input");
	});
});
