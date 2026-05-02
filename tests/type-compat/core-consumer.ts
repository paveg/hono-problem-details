import type {
	ProblemDetails,
	ProblemDetailsHandlerOptions,
	ProblemDetailsInput,
} from "../../dist/index.js";
import {
	createProblemTypeRegistry,
	PROBLEM_JSON_CONTENT_TYPE,
	ProblemDetailsError,
	problemDetails,
	problemDetailsHandler,
	statusToPhrase,
	statusToSlug,
} from "../../dist/index.js";
import {
	createProblemDetailsSchema,
	ProblemDetailsSchema,
	problemDetailsResponse,
} from "../../dist/integrations/openapi.js";
import { standardSchemaProblemHook } from "../../dist/integrations/standard-schema.js";
import { valibotProblemHook } from "../../dist/integrations/valibot.js";
import { zodProblemHook } from "../../dist/integrations/zod.js";

const _ct: typeof PROBLEM_JSON_CONTENT_TYPE = PROBLEM_JSON_CONTENT_TYPE;

const _problem: ProblemDetails = {
	type: "https://example.com/problems/forbidden",
	title: "Forbidden",
	status: 403,
	detail: "You don't have permission",
	instance: "/orders/42",
};

const _input: ProblemDetailsInput = {
	status: 400,
	title: "Bad Request",
};

const _opts: ProblemDetailsHandlerOptions = {
	autoInstance: true,
	includeStack: false,
};

const _err: ProblemDetailsError = new ProblemDetailsError({
	status: 404,
	title: "Not Found",
});

const _factoryResult = problemDetails({ status: 500, title: "Server Error" });

const _handler = problemDetailsHandler();

const _registry = createProblemTypeRegistry({
	ORDER_CONFLICT: {
		type: "https://example.com/problems/order-conflict",
		status: 409,
		title: "Order Conflict",
	},
});
const _registryError: ProblemDetailsError = _registry.create("ORDER_CONFLICT", {
	detail: "Already exists",
});

const _phrase: string | undefined = statusToPhrase(404);
const _slug: string | undefined = statusToSlug(404);

const _zodHook = zodProblemHook();
const _valibotHook = valibotProblemHook();
const _standardHook = standardSchemaProblemHook();
const _problemSchema = ProblemDetailsSchema;
const _problemSchemaFactory = createProblemDetailsSchema;
const _problemResponse = problemDetailsResponse;

void _ct;
void _problem;
void _input;
void _opts;
void _err;
void _factoryResult;
void _handler;
void _registry;
void _registryError;
void _phrase;
void _slug;
void _zodHook;
void _valibotHook;
void _standardHook;
void _problemSchema;
void _problemSchemaFactory;
void _problemResponse;
