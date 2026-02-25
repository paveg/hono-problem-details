import type { Context } from "hono";
import type { BaseIssue, SafeParseResult } from "valibot";
import { PROBLEM_JSON_CONTENT_TYPE } from "../handler.js";

export interface ValibotProblemHookOptions {
	title?: string;
	detail?: string;
}

interface ValidationError {
	field: string;
	message: string;
	code: string;
}

function formatIssues(issues: BaseIssue<unknown>[]): ValidationError[] {
	return issues.map((issue) => ({
		field: issue.path?.map((p) => p.key).join(".") ?? "",
		message: issue.message,
		code: issue.type,
	}));
}

export function valibotProblemHook(
	options?: ValibotProblemHookOptions,
): (result: SafeParseResult<never> & { target: string }, c: Context) => Response | undefined {
	return (result, c) => {
		if (result.success) return;

		const body = {
			type: "about:blank",
			status: 422,
			title: options?.title ?? "Validation Error",
			detail: options?.detail ?? "Request validation failed",
			errors: formatIssues(result.issues),
		};

		return new Response(JSON.stringify(body), {
			status: 422,
			headers: { "Content-Type": PROBLEM_JSON_CONTENT_TYPE },
		});
	};
}
