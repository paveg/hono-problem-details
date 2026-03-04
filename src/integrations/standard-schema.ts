import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Context } from "hono";
import {
	type ValidationError,
	type ValidationHookOptions,
	buildValidationResponse,
} from "./validation.js";

export type { ValidationHookOptions as StandardSchemaProblemHookOptions };

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
	options?: ValidationHookOptions,
): (
	result:
		| { success: true; data: unknown }
		| { success: false; error: readonly StandardSchemaV1.Issue[] },
	c: Context,
) => Response | undefined {
	return (result, _c) => {
		if (result.success) return;
		return buildValidationResponse(formatIssues(result.error), options);
	};
}
