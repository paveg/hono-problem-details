import { describe, expect, it } from "vitest";
import {
	buildProblemResponse,
	clampHttpStatus,
	normalizeProblemDetails,
	PROBLEM_JSON_CONTENT_TYPE,
	safeStringify,
	sanitizeExtensions,
} from "../src/utils.js";

describe("PROBLEM_JSON_CONTENT_TYPE", () => {
	it("U1: matches RFC 9457 media type with charset", () => {
		expect(PROBLEM_JSON_CONTENT_TYPE).toBe("application/problem+json; charset=utf-8");
	});
});

describe("sanitizeExtensions", () => {
	it("U2: returns undefined when input is undefined", () => {
		expect(sanitizeExtensions(undefined)).toBeUndefined();
	});

	it("U3: returns same reference for empty object (no copy)", () => {
		const ext = {};
		expect(sanitizeExtensions(ext)).toBe(ext);
	});

	it("U4: returns same reference when no dangerous keys present", () => {
		const ext = { foo: 1, bar: "baz" };
		expect(sanitizeExtensions(ext)).toBe(ext);
	});

	it("U5: strips all three dangerous keys", () => {
		const result = sanitizeExtensions({
			__proto__: "a",
			constructor: "b",
			prototype: "c",
			safe: "ok",
		});
		expect(result).toEqual({ safe: "ok" });
	});

	it("U6: returns new object (not same reference) when dangerous keys found", () => {
		const ext = { constructor: "bad", safe: "ok" };
		const result = sanitizeExtensions(ext);
		expect(result).not.toBe(ext);
		expect(result).toEqual({ safe: "ok" });
	});
});

describe("clampHttpStatus", () => {
	it.each([
		[200, 200],
		[299, 299],
		[300, 300],
		[399, 399],
		[400, 400],
		[599, 599],
	])("U7: passes through %d as-is", (input, expected) => {
		expect(clampHttpStatus(input)).toBe(expected);
	});

	it.each([
		[199, 500],
		[100, 500],
		[0, 500],
		[-1, 500],
		[600, 500],
		[9999, 500],
	])("U8: clamps %d to 500", (input, expected) => {
		expect(clampHttpStatus(input)).toBe(expected);
	});

	it("U21: returns 500 for non-integer float", () => {
		expect(clampHttpStatus(200.5)).toBe(500);
	});

	it("U22: returns 500 for numeric string", () => {
		expect(clampHttpStatus("200" as unknown as number)).toBe(500);
	});

	it("U23: returns 500 for BigInt", () => {
		expect(clampHttpStatus(200n as unknown as number)).toBe(500);
	});

	it("U24: returns 500 for NaN", () => {
		expect(clampHttpStatus(Number.NaN)).toBe(500);
	});

	it("U25: returns 500 for Infinity", () => {
		expect(clampHttpStatus(Number.POSITIVE_INFINITY)).toBe(500);
	});
});

describe("normalizeProblemDetails", () => {
	it("U9: defaults type to about:blank", () => {
		const pd = normalizeProblemDetails({ status: 404 });
		expect(pd.type).toBe("about:blank");
	});

	it("U10: defaults title from status phrase", () => {
		const pd = normalizeProblemDetails({ status: 404 });
		expect(pd.title).toBe("Not Found");
	});

	it("U11: falls back to Unknown Error for unknown status", () => {
		const pd = normalizeProblemDetails({ status: 999 });
		expect(pd.title).toBe("Unknown Error");
	});

	it("U12: preserves explicit type and title", () => {
		const pd = normalizeProblemDetails({
			status: 400,
			type: "https://example.com/error",
			title: "Custom",
		});
		expect(pd.type).toBe("https://example.com/error");
		expect(pd.title).toBe("Custom");
	});

	it("U13: passes through detail, instance, and extensions", () => {
		const pd = normalizeProblemDetails({
			status: 422,
			detail: "detail",
			instance: "/path",
			extensions: { key: "value" },
		});
		expect(pd.detail).toBe("detail");
		expect(pd.instance).toBe("/path");
		expect(pd.extensions).toEqual({ key: "value" });
	});
});

describe("safeStringify", () => {
	it("U14: serializes plain object", () => {
		const { json, fallback } = safeStringify({ a: 1 });
		expect(fallback).toBe(false);
		expect(JSON.parse(json)).toEqual({ a: 1 });
	});

	it("U15: returns fallback for circular reference", () => {
		const obj: Record<string, unknown> = {};
		obj.self = obj;
		const { json, fallback } = safeStringify(obj);
		expect(fallback).toBe(true);
		const body = JSON.parse(json);
		expect(body.type).toBe("about:blank");
		expect(body.status).toBe(500);
		expect(body.title).toBe("Internal Server Error");
	});

	it("U16: returns fallback for BigInt", () => {
		const { fallback } = safeStringify({ big: BigInt(42) });
		expect(fallback).toBe(true);
	});
});

describe("buildProblemResponse", () => {
	it("U17: builds response with correct status and Content-Type", async () => {
		const res = buildProblemResponse({
			type: "about:blank",
			status: 404,
			title: "Not Found",
		});
		expect(res.status).toBe(404);
		expect(res.headers.get("Content-Type")).toBe(PROBLEM_JSON_CONTENT_TYPE);
		const body = await res.json();
		expect(body.type).toBe("about:blank");
		expect(body.status).toBe(404);
		expect(body.title).toBe("Not Found");
	});

	it("U18: flattens extensions and strips dangerous keys", async () => {
		const res = buildProblemResponse({
			type: "about:blank",
			status: 400,
			title: "Bad Request",
			extensions: { constructor: "bad", info: "safe" },
		});
		const body = await res.json();
		expect(body.info).toBe("safe");
		expect(Object.hasOwn(body, "constructor")).toBe(false);
		expect(Object.hasOwn(body, "extensions")).toBe(false);
	});

	it("U19: clamps out-of-range status to 500", async () => {
		const res = buildProblemResponse({
			type: "about:blank",
			status: 9999,
			title: "Invalid",
		});
		expect(res.status).toBe(500);
		const body = await res.json();
		expect(body.status).toBe(9999);
	});

	it("U20: returns fallback on circular extensions", async () => {
		const circular: Record<string, unknown> = {};
		circular.self = circular;
		const res = buildProblemResponse({
			type: "about:blank",
			status: 422,
			title: "Test",
			extensions: circular,
		});
		expect(res.status).toBe(500);
		const body = await res.json();
		expect(body.title).toBe("Internal Server Error");
	});
});
