import { describe, expect, it } from "vitest";
import { ProblemDetailsError } from "../src/error.js";
import { problemDetails } from "../src/factory.js";

describe("problemDetails factory", () => {
	it("F1: creates problem with minimal input (status only)", () => {
		const error = problemDetails({ status: 404 });
		expect(error.problemDetails.type).toBe("about:blank");
		expect(error.problemDetails.status).toBe(404);
		expect(error.problemDetails.title).toBe("Not Found");
		expect(error.problemDetails.detail).toBeUndefined();
	});

	it("F2: uses all specified fields as-is", () => {
		const error = problemDetails({
			status: 409,
			type: "https://example.com/conflict",
			title: "Custom Title",
			detail: "Custom detail message",
			instance: "/orders/123",
		});
		expect(error.problemDetails.type).toBe("https://example.com/conflict");
		expect(error.problemDetails.status).toBe(409);
		expect(error.problemDetails.title).toBe("Custom Title");
		expect(error.problemDetails.detail).toBe("Custom detail message");
		expect(error.problemDetails.instance).toBe("/orders/123");
	});

	it("F3: flattens extension members to top level in response body", async () => {
		const error = problemDetails({
			status: 422,
			extensions: {
				errors: [{ field: "email", message: "invalid" }],
			},
		});
		const response = error.getResponse();
		const body = await response.json();
		expect(body.errors).toEqual([{ field: "email", message: "invalid" }]);
		expect(body.extensions).toBeUndefined();
	});

	it("F4: getResponse() returns correct Content-Type and JSON body", async () => {
		const error = problemDetails({ status: 400 });
		const response = error.getResponse();
		expect(response.headers.get("Content-Type")).toBe("application/problem+json");
		const body = await response.json();
		expect(body.type).toBe("about:blank");
		expect(body.status).toBe(400);
		expect(body.title).toBe("Bad Request");
	});

	it("F5: response status matches problem status (RFC 9457 MUST)", () => {
		const error = problemDetails({ status: 422 });
		const response = error.getResponse();
		expect(response.status).toBe(422);
	});

	it("F6: is instanceof Error", () => {
		const error = problemDetails({ status: 500 });
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(ProblemDetailsError);
	});

	it("falls back to 'Unknown Error' title for unknown status code", () => {
		const error = problemDetails({ status: 999 });
		expect(error.problemDetails.title).toBe("Unknown Error");
	});

	it("F7: standard fields take precedence over colliding extension keys", async () => {
		const error = problemDetails({
			status: 422,
			type: "https://example.com/validation",
			title: "Validation Error",
			extensions: { status: 200, type: "evil", title: "Fake" },
		});
		const response = error.getResponse();
		const body = await response.json();
		expect(body.status).toBe(422);
		expect(body.type).toBe("https://example.com/validation");
		expect(body.title).toBe("Validation Error");
		expect(response.status).toBe(422);
	});

	it("F8: error.message is detail when detail is provided", () => {
		const error = problemDetails({ status: 404, detail: "User 123 not found" });
		expect(error.message).toBe("User 123 not found");
	});

	it("F9: error.message is title when detail is omitted", () => {
		const error = problemDetails({ status: 404 });
		expect(error.message).toBe("Not Found");
	});

	it("F10: prototype-like extension keys are inert", async () => {
		const error = problemDetails({
			status: 400,
			extensions: { __proto__: { polluted: true }, constructor: "bad" },
		});
		const response = error.getResponse();
		const body = await response.json();
		expect(body.status).toBe(400);
		// constructor extension key appears in serialized body
		expect(body.constructor).toBe("bad");
		// __proto__ in object literals sets prototype, not own property — not serialized
		expect(Object.hasOwn(body, "__proto__")).toBe(false);
		// Object.prototype is not polluted
		expect(({} as Record<string, unknown>).polluted).toBeUndefined();
	});
});
