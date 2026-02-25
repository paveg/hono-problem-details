import type { Context } from "hono";
import type { ZodError } from "zod";

export interface ZodProblemHookOptions {
	title?: string;
	detail?: string;
}

interface ValidationError {
	field: string;
	message: string;
	code: string;
}

function formatErrors(zodError: ZodError): ValidationError[] {
	return zodError.issues.map((issue) => ({
		field: issue.path.join("."),
		message: issue.message,
		code: issue.code,
	}));
}

export function zodProblemHook(
	options?: ZodProblemHookOptions,
): (
	result: { success: true; data: unknown } | { success: false; error: ZodError },
	c: Context,
) => Response | undefined {
	return (result, c) => {
		if (result.success) return;

		const body = {
			type: "about:blank",
			status: 422,
			title: options?.title ?? "Validation Error",
			detail: options?.detail ?? "Request validation failed",
			errors: formatErrors(result.error),
		};

		return new Response(JSON.stringify(body), {
			status: 422,
			headers: { "Content-Type": "application/problem+json" },
		});
	};
}
