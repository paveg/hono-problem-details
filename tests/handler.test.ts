import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { describe, expect, it } from "vitest";
import { ProblemDetailsError } from "../src/error.js";
import { problemDetails } from "../src/factory.js";
import { problemDetailsHandler } from "../src/handler.js";

function createApp(options?: Parameters<typeof problemDetailsHandler>[0]) {
	const app = new Hono();
	app.onError(problemDetailsHandler(options));
	return app;
}

describe("problemDetailsHandler", () => {
	it("H1: returns ProblemDetailsError response as-is", async () => {
		const app = createApp();
		app.get("/", () => {
			throw problemDetails({
				status: 409,
				type: "https://example.com/conflict",
				title: "Conflict",
				detail: "Resource already exists",
			});
		});
		const res = await app.request("/");
		expect(res.status).toBe(409);
		const body = await res.json();
		expect(body.type).toBe("https://example.com/conflict");
		expect(body.title).toBe("Conflict");
		expect(body.detail).toBe("Resource already exists");
	});

	it("H2: converts HTTPException to Problem Details", async () => {
		const app = createApp();
		app.get("/", () => {
			throw new HTTPException(403, { message: "Forbidden" });
		});
		const res = await app.request("/");
		expect(res.status).toBe(403);
		const body = await res.json();
		expect(body.type).toBe("about:blank");
		expect(body.status).toBe(403);
		expect(body.title).toBe("Forbidden");
		expect(body.detail).toBe("Forbidden");
	});

	it("H3: converts generic Error to 500 Problem Details", async () => {
		const app = createApp();
		app.get("/", () => {
			throw new Error("Something broke");
		});
		const res = await app.request("/");
		expect(res.status).toBe(500);
		const body = await res.json();
		expect(body.type).toBe("about:blank");
		expect(body.status).toBe(500);
		expect(body.title).toBe("Internal Server Error");
	});

	it("H4: uses typePrefix to build type URI", async () => {
		const app = createApp({ typePrefix: "https://api.example.com/problems" });
		app.get("/", () => {
			throw new HTTPException(422);
		});
		const res = await app.request("/");
		const body = await res.json();
		expect(body.type).toBe("https://api.example.com/problems/unprocessable-content");
	});

	it("H5: uses about:blank when typePrefix is not set", async () => {
		const app = createApp();
		app.get("/", () => {
			throw new HTTPException(404);
		});
		const res = await app.request("/");
		const body = await res.json();
		expect(body.type).toBe("about:blank");
	});

	it("H6: includes stack trace in detail when includeStack is true", async () => {
		const app = createApp({ includeStack: true });
		app.get("/", () => {
			throw new Error("Debug error");
		});
		const res = await app.request("/");
		const body = await res.json();
		expect(body.detail).toContain("Debug error");
		expect(body.detail).toContain("at");
	});

	it("H7: excludes stack trace by default", async () => {
		const app = createApp();
		app.get("/", () => {
			throw new Error("Secret error");
		});
		const res = await app.request("/");
		const body = await res.json();
		expect(body.detail).toBeUndefined();
	});

	it("H8: uses mapError custom mapping", async () => {
		class CustomError extends Error {
			statusCode = 418;
		}
		const app = createApp({
			mapError: (error) => {
				if (error instanceof CustomError) {
					return {
						status: error.statusCode,
						title: "I'm a Teapot",
						detail: error.message,
					};
				}
				return undefined;
			},
		});
		app.get("/", () => {
			throw new CustomError("Custom error");
		});
		const res = await app.request("/");
		expect(res.status).toBe(418);
		const body = await res.json();
		expect(body.title).toBe("I'm a Teapot");
		expect(body.detail).toBe("Custom error");
	});

	it("H9: falls back to default when mapError returns undefined", async () => {
		const app = createApp({
			mapError: () => undefined,
		});
		app.get("/", () => {
			throw new Error("Unmapped error");
		});
		const res = await app.request("/");
		expect(res.status).toBe(500);
		const body = await res.json();
		expect(body.title).toBe("Internal Server Error");
	});

	it("uses 'Unknown Error' title when mapError returns unmapped status", async () => {
		const app = createApp({
			mapError: () => ({ status: 599 }),
		});
		app.get("/", () => {
			throw new Error("test");
		});
		const res = await app.request("/");
		expect(res.status).toBe(599);
		const body = await res.json();
		expect(body.title).toBe("Unknown Error");
	});

	it("H10: sets Content-Type with charset=utf-8", async () => {
		const app = createApp();
		app.get("/", () => {
			throw new HTTPException(400);
		});
		const res = await app.request("/");
		expect(res.headers.get("Content-Type")).toBe("application/problem+json; charset=utf-8");
	});

	it("H23: extensions with dangerous keys are stripped", async () => {
		const app = createApp({
			mapError: () => ({
				status: 400,
				extensions: { constructor: "bad", prototype: "bad", safe: "ok" },
			}),
		});
		app.get("/", () => {
			throw new Error("test");
		});
		const res = await app.request("/");
		const body = await res.json();
		expect(body.safe).toBe("ok");
		expect(Object.hasOwn(body, "constructor")).toBe(false);
		expect(Object.hasOwn(body, "prototype")).toBe(false);
	});

	it("uses defaultType option when set", async () => {
		const app = createApp({ defaultType: "https://example.com/default" });
		app.get("/", () => {
			throw new HTTPException(400);
		});
		const res = await app.request("/");
		const body = await res.json();
		expect(body.type).toBe("https://example.com/default");
	});

	it("H12: localize callback transforms ProblemDetails before response", async () => {
		const app = createApp({
			localize: (pd, c) => ({
				...pd,
				title: `[ja] ${pd.title}`,
				detail: pd.detail ? `[ja] ${pd.detail}` : undefined,
			}),
		});
		app.get("/", () => {
			throw new HTTPException(404, { message: "Resource not found" });
		});
		const res = await app.request("/");
		const body = await res.json();
		expect(body.title).toBe("[ja] Not Found");
		expect(body.detail).toBe("[ja] Resource not found");
	});

	it("H13: localize receives Hono context for Accept-Language access", async () => {
		const app = createApp({
			localize: (pd, c) => {
				const lang = c.req.header("Accept-Language");
				if (lang?.startsWith("ja")) {
					return { ...pd, title: "見つかりません" };
				}
				return pd;
			},
		});
		app.get("/", () => {
			throw new HTTPException(404);
		});
		const res = await app.request("/", {
			headers: { "Accept-Language": "ja-JP" },
		});
		const body = await res.json();
		expect(body.title).toBe("見つかりません");
	});

	it("H14: localize applies to generic Error responses", async () => {
		const app = createApp({
			localize: (pd) => ({ ...pd, title: "Erreur Interne" }),
		});
		app.get("/", () => {
			throw new Error("crash");
		});
		const res = await app.request("/");
		const body = await res.json();
		expect(body.title).toBe("Erreur Interne");
		expect(body.status).toBe(500);
	});

	it("H15: localize applies to mapError responses", async () => {
		const app = createApp({
			mapError: () => ({ status: 409, title: "Conflict", detail: "Already exists" }),
			localize: (pd) => ({ ...pd, title: "Conflit" }),
		});
		app.get("/", () => {
			throw new Error("test");
		});
		const res = await app.request("/");
		const body = await res.json();
		expect(body.title).toBe("Conflit");
	});

	it("H11: sets problemDetails on context", async () => {
		let captured: unknown;
		const app = new Hono();
		app.use(async (c, next) => {
			await next();
			captured = c.get("problemDetails");
		});
		app.onError(problemDetailsHandler());
		app.get("/", () => {
			throw new HTTPException(404);
		});
		await app.request("/");
		expect(captured).toBeDefined();
		expect((captured as { status: number }).status).toBe(404);
	});

	it("H16: sets problemDetails on context for ProblemDetailsError", async () => {
		let captured: unknown;
		const app = new Hono();
		app.use(async (c, next) => {
			await next();
			captured = c.get("problemDetails");
		});
		app.onError(problemDetailsHandler());
		app.get("/", () => {
			throw problemDetails({ status: 409, title: "Conflict" });
		});
		await app.request("/");
		expect(captured).toBeDefined();
		expect((captured as { status: number }).status).toBe(409);
	});

	it("H17: localize applies to ProblemDetailsError", async () => {
		const app = createApp({
			localize: (pd) => ({ ...pd, title: "Localized" }),
		});
		app.get("/", () => {
			throw problemDetails({ status: 404, title: "Not Found" });
		});
		const res = await app.request("/");
		const body = await res.json();
		expect(body.title).toBe("Localized");
	});

	it("H18: falls back to about:blank when typePrefix is set but status is unknown", async () => {
		const app = createApp({ typePrefix: "https://api.example.com/problems" });
		app.get("/", () => {
			// biome-ignore lint/suspicious/noExplicitAny: testing with non-standard status code
			throw new HTTPException(599 as any);
		});
		const res = await app.request("/");
		const body = await res.json();
		expect(body.type).toBe("about:blank");
	});

	it("H19: uses defaultType when typePrefix is set but slug is unknown", async () => {
		const app = createApp({
			typePrefix: "https://api.example.com/problems",
			defaultType: "https://api.example.com/problems/unknown",
		});
		app.get("/", () => {
			// biome-ignore lint/suspicious/noExplicitAny: testing with non-standard status code
			throw new HTTPException(599 as any);
		});
		const res = await app.request("/");
		const body = await res.json();
		expect(body.type).toBe("https://api.example.com/problems/unknown");
	});

	it("H20: defaults type to about:blank when mapError omits type", async () => {
		const app = createApp({
			mapError: () => ({ status: 409, title: "Conflict" }),
		});
		app.get("/", () => {
			throw new Error("test");
		});
		const res = await app.request("/");
		const body = await res.json();
		expect(body.type).toBe("about:blank");
	});

	it("H21: standard fields not overwritten by extensions in handler path", async () => {
		const app = createApp({
			mapError: () => ({
				status: 422,
				title: "Validation Error",
				extensions: { status: 200, title: "Fake" },
			}),
		});
		app.get("/", () => {
			throw new Error("test");
		});
		const res = await app.request("/");
		const body = await res.json();
		expect(body.status).toBe(422);
		expect(body.title).toBe("Validation Error");
		expect(res.status).toBe(422);
	});

	it("H22: HTTP response status matches body status (RFC 9457)", async () => {
		const app = createApp();
		app.get("/", () => {
			throw new HTTPException(422);
		});
		const res = await app.request("/");
		const body = await res.json();
		expect(res.status).toBe(body.status);
	});

	it("H24: clamps invalid status code to 500 in HTTP response", async () => {
		const app = createApp({
			mapError: () => ({ status: 9999, title: "Invalid" }),
		});
		app.get("/", () => {
			throw new Error("test");
		});
		const res = await app.request("/");
		expect(res.status).toBe(500);
		const body = await res.json();
		expect(body.status).toBe(9999);
	});

	it("H25: clamps negative status code to 500", async () => {
		const app = createApp({
			mapError: () => ({ status: -1, title: "Negative" }),
		});
		app.get("/", () => {
			throw new Error("test");
		});
		const res = await app.request("/");
		expect(res.status).toBe(500);
	});

	it("H26: accepts valid error status codes (400-599)", async () => {
		for (const status of [400, 404, 500, 599]) {
			const app = createApp({
				mapError: () => ({ status, title: "Test" }),
			});
			app.get("/", () => {
				throw new Error("test");
			});
			const res = await app.request("/");
			expect(res.status).toBe(status);
		}
	});
});
