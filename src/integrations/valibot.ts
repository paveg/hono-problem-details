import type { Context } from "hono";
import type { BaseIssue, GenericSchema, GenericSchemaAsync, SafeParseResult } from "valibot";
import {
	type ValidationError,
	type ValidationHookOptions,
	buildValidationResponse,
} from "./validation.js";

export type { ValidationHookOptions as ValibotProblemHookOptions };

function formatIssues(issues: BaseIssue<unknown>[]): ValidationError[] {
	return issues.map((issue) => ({
		field: issue.path?.map((p) => p.key).join(".") ?? "",
		message: issue.message,
		code: issue.type,
	}));
}

/**
 * Create a `@hono/valibot-validator` hook that returns RFC 9457 Problem Details
 * on validation failure (422 Unprocessable Content with `errors` extension).
 */
export function valibotProblemHook<T extends GenericSchema | GenericSchemaAsync = GenericSchema>(
	options?: ValidationHookOptions,
): (result: SafeParseResult<T> & { target: string }, c: Context) => Response | undefined {
	return (result, _c) => {
		if (result.success) return;
		return buildValidationResponse(formatIssues(result.issues), options);
	};
}
