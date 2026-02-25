import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { valibotProblemHook } from "../../src/integrations/valibot.js";

function createApp(hookOptions?: Parameters<typeof valibotProblemHook>[0]) {
	const app = new Hono();
	const schema = v.object({
		email: v.pipe(v.string(), v.email()),
		age: v.pipe(v.number(), v.minValue(1)),
		address: v.optional(
			v.object({
				city: v.pipe(v.string(), v.minLength(1)),
			}),
		),
	});
	app.post("/users", vValidator("json", schema, valibotProblemHook(hookOptions)), (c) => {
		return c.json({ ok: true });
	});
	return app;
}

describe("valibotProblemHook", () => {
	it("V1: passes through on validation success", async () => {
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

	it("V2: returns 422 with single field error", async () => {
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

	it("V3: returns 422 with multiple field errors", async () => {
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

	it("V4: uses dot-separated path for nested field errors", async () => {
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

	it("V5: sets Content-Type to application/problem+json with charset", async () => {
		const app = createApp();
		const res = await app.request("/users", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "invalid", age: 25 }),
		});
		expect(res.headers.get("Content-Type")).toBe("application/problem+json; charset=utf-8");
	});

	it("V6: errors have { field, message, code } structure", async () => {
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

	it("handles errors without path (root-level validation)", async () => {
		const app = new Hono();
		// pipe on object-level produces issues without path
		const schema = v.pipe(
			v.object({ a: v.string() }),
			v.check(() => false, "root error"),
		);
		app.post("/test", vValidator("json", schema, valibotProblemHook()), (c) => {
			return c.json({ ok: true });
		});
		const res = await app.request("/test", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ a: "valid" }),
		});
		expect(res.status).toBe(422);
		const body = await res.json();
		expect(body.errors[0].field).toBe("");
	});

	it("V7: allows custom title and detail via options", async () => {
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
