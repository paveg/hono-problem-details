import type { OtelApiLike } from "../types";

/**
 * Safely retrieve the current trace ID from OpenTelemetry, if available.
 */
export function getOtelTraceId(api: OtelApiLike): string | undefined {
	try {
		const span = api.trace.getSpan(api.context.active());
		const traceId = span?.spanContext().traceId;
		return traceId;
	} catch {
		return undefined;
	}
}
