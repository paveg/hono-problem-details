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
});

describe("statusToSlug", () => {
	it.each([
		[400, "bad-request"],
		[401, "unauthorized"],
		[403, "forbidden"],
		[404, "not-found"],
		[409, "conflict"],
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
});
