import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Context } from "hono";
import { PROBLEM_JSON_CONTENT_TYPE } from "../handler.js";

export interface StandardSchemaProblemHookOptions {
	title?: string;
	detail?: string;
}

interface ValidationError {
	field: string;
	message: string;
}

function formatPath(path: ReadonlyArray<PropertyKey | StandardSchemaV1.PathSegment>): string {
	return path
		.map((segment) => (typeof segment === "object" ? String(segment.key) : String(segment)))
		.join(".");
}

function formatIssues(issues: readonly StandardSchemaV1.Issue[]): ValidationError[] {
	return issues.map((issue) => ({
		field: issue.path ? formatPath(issue.path) : "",
		message: issue.message,
	}));
}

export function standardSchemaProblemHook(
	options?: StandardSchemaProblemHookOptions,
): (
	result:
		| { success: true; data: unknown }
		| { success: false; error: readonly StandardSchemaV1.Issue[] },
	c: Context,
) => Response | undefined {
	return (result, c) => {
		if (result.success) return;

		const body = {
			type: "about:blank",
			status: 422,
			title: options?.title ?? "Validation Error",
			detail: options?.detail ?? "Request validation failed",
			errors: formatIssues(result.error),
		};

		return new Response(JSON.stringify(body), {
			status: 422,
			headers: { "Content-Type": PROBLEM_JSON_CONTENT_TYPE },
		});
	};
}
