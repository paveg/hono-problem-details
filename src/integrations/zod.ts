import type { Context } from "hono";
import type { ZodError } from "zod";
import {
	type ValidationError,
	type ValidationHookOptions,
	buildValidationResponse,
} from "./validation.js";

export type { ValidationHookOptions as ZodProblemHookOptions };

function formatErrors(zodError: ZodError): ValidationError[] {
	return zodError.issues.map((issue) => ({
		field: issue.path.join("."),
		message: issue.message,
		code: issue.code,
	}));
}

export function zodProblemHook(
	options?: ValidationHookOptions,
): (
	result: { success: true; data: unknown } | { success: false; error: ZodError },
	c: Context,
) => Response | undefined {
	return (result, _c) => {
		if (result.success) return;
		return buildValidationResponse(formatErrors(result.error), options);
	};
}
