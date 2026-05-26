import type * as otelApi from "@opentelemetry/api";
import type { OtelApiLike } from "../../src/types.js";

/**
 * This test ensures that our OtelApiLike type definition is compatible with the official OpenTelemetry API.
 *
 * @param api The real OpenTelemetry API object.
 * @returns The same object, typed as OtelApiLike.
 */
const _testCompatibility = (api: typeof otelApi): OtelApiLike => {
	return api;
};
