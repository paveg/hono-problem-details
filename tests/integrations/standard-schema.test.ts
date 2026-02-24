import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";
import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { standardSchemaProblemHook } from "../../src/integrations/standard-schema.js";

describe("standardSchemaProblemHook", () => {
	it("S1: returns nothing on success (Zod)", async () => {
		const app = new Hono();
		const schema = z.object({ name: z.string() });

		app.post("/test", sValidator("json", schema, standardSchemaProblemHook()), (c) => {
			return c.json({ ok: true });
		});

		const res = await app.request("/test", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "test" }),
		});
		expect(res.status).toBe(200);
	});

	it("S2: returns 422 with errors on single field error (Zod)", async () => {
		const app = new Hono();
		const schema = z.object({ email: z.string().email() });

		app.post("/test", sValidator("json", schema, standardSchemaProblemHook()), (c) => {
			return c.json({ ok: true });
		});

		const res = await app.request("/test", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "invalid" }),
		});
		expect(res.status).toBe(422);
		expect(res.headers.get("Content-Type")).toContain("application/problem+json");

		const body = await res.json();
		expect(body.type).toBe("about:blank");
		expect(body.status).toBe(422);
		expect(body.title).toBe("Validation Error");
		expect(body.detail).toBe("Request validation failed");
		expect(body.errors).toHaveLength(1);
		expect(body.errors[0].field).toBe("email");
		expect(body.errors[0].message).toBeDefined();
	});

	it("S3: returns multiple errors (Zod)", async () => {
		const app = new Hono();
		const schema = z.object({
			email: z.string().email(),
			age: z.number().positive(),
		});

		app.post("/test", sValidator("json", schema, standardSchemaProblemHook()), (c) => {
			return c.json({ ok: true });
		});

		const res = await app.request("/test", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "bad", age: -1 }),
		});
		const body = await res.json();
		expect(body.errors.length).toBeGreaterThanOrEqual(2);
	});

	it("S4: handles nested field paths (Valibot)", async () => {
		const app = new Hono();
		const schema = v.object({
			address: v.object({
				city: v.pipe(v.string(), v.minLength(1)),
			}),
		});

		app.post("/test", sValidator("json", schema, standardSchemaProblemHook()), (c) => {
			return c.json({ ok: true });
		});

		const res = await app.request("/test", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ address: { city: "" } }),
		});
		const body = await res.json();
		expect(body.errors[0].field).toBe("address.city");
	});

	it("S5: works with Valibot schemas", async () => {
		const app = new Hono();
		const schema = v.object({
			name: v.pipe(v.string(), v.minLength(1)),
		});

		app.post("/test", sValidator("json", schema, standardSchemaProblemHook()), (c) => {
			return c.json({ ok: true });
		});

		const res = await app.request("/test", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "" }),
		});
		expect(res.status).toBe(422);
		const body = await res.json();
		expect(body.errors).toHaveLength(1);
	});

	it("S6: custom title and detail options", async () => {
		const app = new Hono();
		const schema = z.object({ name: z.string() });

		app.post(
			"/test",
			sValidator(
				"json",
				schema,
				standardSchemaProblemHook({
					title: "Bad Input",
					detail: "Please check your data",
				}),
			),
			(c) => c.json({ ok: true }),
		);

		const res = await app.request("/test", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: 42 }),
		});
		const body = await res.json();
		expect(body.title).toBe("Bad Input");
		expect(body.detail).toBe("Please check your data");
	});

	it("S7: handles errors without path", async () => {
		const app = new Hono();
		const schema = v.pipe(
			v.object({ a: v.string() }),
			v.check(() => false, "root error"),
		);

		app.post("/test", sValidator("json", schema, standardSchemaProblemHook()), (c) => {
			return c.json({ ok: true });
		});

		const res = await app.request("/test", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ a: "ok" }),
		});
		const body = await res.json();
		expect(body.errors[0].field).toBe("");
	});
});
