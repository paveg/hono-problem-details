import type { Context } from "hono";
import {
	buildValidationResponse,
	type ValidationError,
	type ValidationHookOptions,
} from "./validation.js";

export type { ValidationHookOptions as ZodProblemHookOptions };

// zod 4's @hono/zod-validator passes the core `$ZodError`, not the classic `ZodError`.
type ZodErrorLike = {
	readonly issues: ReadonlyArray<{
		readonly path: ReadonlyArray<PropertyKey>;
		readonly message: string;
		readonly code: string;
	}>;
};

function formatErrors(zodError: ZodErrorLike): ValidationError[] {
	return zodError.issues.map((issue) => ({
		field: issue.path.join("."),
		message: issue.message,
		code: issue.code,
	}));
}

/**
 * Create a `@hono/zod-validator` hook that returns RFC 9457 Problem Details
 * on validation failure (422 Unprocessable Content with `errors` extension).
 */
export function zodProblemHook(
	options?: ValidationHookOptions,
): (
	result: { success: true; data: unknown } | { success: false; error: ZodErrorLike },
	c: Context,
) => Response | undefined {
	return (result, _c) => {
		if (result.success) return;
		return buildValidationResponse(formatErrors(result.error), options);
	};
}
