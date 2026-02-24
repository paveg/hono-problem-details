import { describe, expectTypeOf, it } from "vitest";
import type { ProblemDetailsError } from "../src/error.js";
import { problemDetails } from "../src/factory.js";
import type {
	ProblemDetails,
	ProblemDetailsHandlerOptions,
	ProblemDetailsInput,
} from "../src/types.js";

describe("ProblemDetails type", () => {
	it("has required fields type, status, title", () => {
		expectTypeOf<ProblemDetails>().toHaveProperty("type");
		expectTypeOf<ProblemDetails>().toHaveProperty("status");
		expectTypeOf<ProblemDetails>().toHaveProperty("title");
		expectTypeOf<ProblemDetails["type"]>().toEqualTypeOf<string>();
		expectTypeOf<ProblemDetails["status"]>().toEqualTypeOf<number>();
		expectTypeOf<ProblemDetails["title"]>().toEqualTypeOf<string>();
	});

	it("has optional fields detail, instance", () => {
		expectTypeOf<ProblemDetails["detail"]>().toEqualTypeOf<string | undefined>();
		expectTypeOf<ProblemDetails["instance"]>().toEqualTypeOf<string | undefined>();
	});

	it("generic parameter types extensions", () => {
		type CustomExt = { traceId: string; retryAfter: number };
		type PD = ProblemDetails<CustomExt>;
		expectTypeOf<PD["extensions"]>().toEqualTypeOf<CustomExt | undefined>();
	});

	it("default generic parameter is Record<string, unknown>", () => {
		expectTypeOf<ProblemDetails["extensions"]>().toEqualTypeOf<
			Record<string, unknown> | undefined
		>();
	});
});

describe("ProblemDetailsInput type", () => {
	it("requires status only", () => {
		expectTypeOf<{ status: number }>().toMatchTypeOf<ProblemDetailsInput>();
	});

	it("type, title, detail, instance are optional", () => {
		expectTypeOf<ProblemDetailsInput["type"]>().toEqualTypeOf<string | undefined>();
		expectTypeOf<ProblemDetailsInput["title"]>().toEqualTypeOf<string | undefined>();
		expectTypeOf<ProblemDetailsInput["detail"]>().toEqualTypeOf<string | undefined>();
		expectTypeOf<ProblemDetailsInput["instance"]>().toEqualTypeOf<string | undefined>();
	});

	it("generic parameter types extensions", () => {
		type CustomExt = { errors: string[] };
		type Input = ProblemDetailsInput<CustomExt>;
		expectTypeOf<Input["extensions"]>().toEqualTypeOf<CustomExt | undefined>();
	});
});

describe("ProblemDetailsHandlerOptions type", () => {
	it("all fields are optional", () => {
		// biome-ignore lint/complexity/noBannedTypes: testing that empty object satisfies the type
		expectTypeOf<{}>().toMatchTypeOf<ProblemDetailsHandlerOptions>();
	});

	it("mapError accepts Error and returns ProblemDetailsInput or undefined", () => {
		expectTypeOf<ProblemDetailsHandlerOptions["mapError"]>().toEqualTypeOf<
			((error: Error) => ProblemDetailsInput | undefined) | undefined
		>();
	});
});

describe("problemDetails() factory type inference", () => {
	it("returns ProblemDetailsError", () => {
		const err = problemDetails({ status: 404 });
		expectTypeOf(err).toEqualTypeOf<ProblemDetailsError>();
	});

	it("accepts typed extensions", () => {
		const err = problemDetails({
			status: 422,
			extensions: { errors: [{ field: "email", message: "invalid" }] },
		});
		expectTypeOf(err).toEqualTypeOf<ProblemDetailsError>();
	});
});

describe("ProblemDetailsError type", () => {
	it("extends Error", () => {
		expectTypeOf<ProblemDetailsError>().toMatchTypeOf<Error>();
	});

	it("has readonly problemDetails property", () => {
		expectTypeOf<ProblemDetailsError["problemDetails"]>().toEqualTypeOf<ProblemDetails>();
	});

	it("getResponse returns Response", () => {
		expectTypeOf<ProblemDetailsError["getResponse"]>().toEqualTypeOf<() => Response>();
	});
});
