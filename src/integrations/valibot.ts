import type { Context } from "hono";
import type { BaseIssue, SafeParseResult } from "valibot";
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

export function valibotProblemHook(
	options?: ValidationHookOptions,
): (result: SafeParseResult<never> & { target: string }, c: Context) => Response | undefined {
	return (result, _c) => {
		if (result.success) return;
		return buildValidationResponse(formatIssues(result.issues), options);
	};
}
