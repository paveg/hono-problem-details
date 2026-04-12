import { bench, describe } from "vitest";
import { ProblemDetailsError } from "../src/error.js";
import type { ProblemDetails } from "../src/types.js";
import {
	buildProblemResponse,
	clampHttpStatus,
	normalizeProblemDetails,
	safeStringify,
	sanitizeExtensions,
} from "../src/utils.js";

// ── normalizeProblemDetails ─────────────────────────────────────────

describe("normalizeProblemDetails", () => {
	bench("minimal input (status only)", () => {
		normalizeProblemDetails({ status: 404 });
	});

	bench("full input (all fields)", () => {
		normalizeProblemDetails({
			status: 409,
			type: "https://api.example.com/problems/order-conflict",
			title: "Order Conflict",
			detail: "Order abc-123 already exists",
			instance: "/orders/abc-123",
		});
	});

	bench("with extensions", () => {
		normalizeProblemDetails({
			status: 429,
			title: "Too Many Requests",
			extensions: { retryAfter: 60, quota: 1000, remaining: 0 },
		});
	});
});

// ── sanitizeExtensions ──────────────────────────────────────────────

describe("sanitizeExtensions", () => {
	const clean = { retryAfter: 60, quota: 1000, remaining: 0 };
	const dirty = { retryAfter: 60, constructor: "foo", prototype: "bar" };

	bench("no dangerous keys (common path)", () => {
		sanitizeExtensions(clean);
	});

	bench("with dangerous keys (rare path)", () => {
		sanitizeExtensions(dirty);
	});

	bench("undefined extensions", () => {
		sanitizeExtensions(undefined);
	});
});

// ── clampHttpStatus ─────────────────────────────────────────────────

describe("clampHttpStatus", () => {
	bench("valid status", () => {
		clampHttpStatus(404);
	});

	bench("out of range", () => {
		clampHttpStatus(999);
	});

	bench("non-integer", () => {
		clampHttpStatus(404.5);
	});
});

// ── safeStringify ───────────────────────────────────────────────────

describe("safeStringify", () => {
	const small = { type: "about:blank", status: 404, title: "Not Found" };
	const medium = {
		type: "about:blank",
		status: 422,
		title: "Validation Error",
		detail: "Request validation failed",
		errors: Array.from({ length: 10 }, (_, i) => ({
			field: `field_${i}`,
			message: `Error message for field ${i}`,
			code: "invalid_type",
		})),
	};

	bench("small payload (~80 bytes)", () => {
		safeStringify(small);
	});

	bench("medium payload (10 validation errors)", () => {
		safeStringify(medium);
	});
});

// ── buildProblemResponse (end-to-end serialization) ─────────────────

describe("buildProblemResponse", () => {
	const minimal: ProblemDetails = {
		type: "about:blank",
		status: 404,
		title: "Not Found",
	};

	const withDetail: ProblemDetails = {
		type: "about:blank",
		status: 404,
		title: "Not Found",
		detail: "Order abc-123 does not exist",
		instance: "/orders/abc-123",
	};

	const withExtensions: ProblemDetails = {
		type: "https://api.example.com/problems/rate-limited",
		status: 429,
		title: "Too Many Requests",
		detail: "Request quota exceeded",
		extensions: { retryAfter: 60, quota: 1000, remaining: 0 },
	};

	bench("minimal (no detail, no extensions)", () => {
		buildProblemResponse(minimal);
	});

	bench("with detail and instance", () => {
		buildProblemResponse(withDetail);
	});

	bench("with extensions (flatten + sanitize + stringify)", () => {
		buildProblemResponse(withExtensions);
	});
});

// ── ProblemDetailsError construction ────────────────────────────────

describe("ProblemDetailsError", () => {
	bench("construct with minimal input", () => {
		new ProblemDetailsError({ status: 404 });
	});

	bench("construct with full input + extensions", () => {
		new ProblemDetailsError({
			status: 409,
			type: "https://api.example.com/problems/order-conflict",
			title: "Order Conflict",
			detail: "Order abc-123 already exists",
			instance: "/orders/abc-123",
			extensions: { retryAfter: 60 },
		});
	});
});
