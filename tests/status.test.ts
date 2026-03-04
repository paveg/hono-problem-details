import { describe, expect, it } from "vitest";
import { statusToPhrase, statusToSlug } from "../src/status.js";

describe("statusToPhrase", () => {
	it.each([
		[400, "Bad Request"],
		[401, "Unauthorized"],
		[403, "Forbidden"],
		[404, "Not Found"],
		[409, "Conflict"],
		[422, "Unprocessable Content"],
		[429, "Too Many Requests"],
		[500, "Internal Server Error"],
		[502, "Bad Gateway"],
		[503, "Service Unavailable"],
	])("returns %j for status %d", (status, expected) => {
		expect(statusToPhrase(status)).toBe(expected);
	});

	it("returns undefined for unknown status code", () => {
		expect(statusToPhrase(999)).toBeUndefined();
	});

	it("covers all status codes in STATUS_PHRASES", () => {
		const allStatuses = [
			400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418,
			421, 422, 423, 424, 425, 426, 428, 429, 431, 451, 500, 501, 502, 503, 504, 505, 506, 507, 508,
			510, 511,
		];
		for (const status of allStatuses) {
			expect(statusToPhrase(status)).toBeDefined();
		}
	});
});

describe("statusToSlug", () => {
	it.each([
		[400, "bad-request"],
		[401, "unauthorized"],
		[403, "forbidden"],
		[404, "not-found"],
		[409, "conflict"],
		[418, "im-a-teapot"],
		[422, "unprocessable-content"],
		[429, "too-many-requests"],
		[500, "internal-server-error"],
		[502, "bad-gateway"],
		[503, "service-unavailable"],
	])("returns %j for status %d", (status, expected) => {
		expect(statusToSlug(status)).toBe(expected);
	});

	it("returns undefined for unknown status code", () => {
		expect(statusToSlug(999)).toBeUndefined();
	});

	it("covers all status codes in STATUS_SLUGS", () => {
		const allStatuses = [
			400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418,
			421, 422, 423, 424, 425, 426, 428, 429, 431, 451, 500, 501, 502, 503, 504, 505, 506, 507, 508,
			510, 511,
		];
		for (const status of allStatuses) {
			const slug = statusToSlug(status);
			expect(slug).toBeDefined();
			expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
		}
	});
});
