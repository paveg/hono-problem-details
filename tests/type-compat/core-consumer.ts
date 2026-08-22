import type {
	ProblemDetails,
	ProblemDetailsHandlerOptions,
	ProblemDetailsInput,
} from "hono-problem-details";
import {
	createProblemTypeRegistry,
	PROBLEM_JSON_CONTENT_TYPE,
	ProblemDetailsError,
	problemDetails,
	problemDetailsHandler,
	statusToPhrase,
	statusToSlug,
} from "hono-problem-details";
import {
	createProblemDetailsSchema,
	getProblemDetailsSchema,
	problemDetailsResponse,
} from "hono-problem-details/openapi";
import type {
	JsonSchemaObject,
	ProblemDetailsJsonSchema,
} from "hono-problem-details/openapi-json-schema";
import {
	problemDetailsJsonSchema,
	problemDetailsResponseJsonSchema,
} from "hono-problem-details/openapi-json-schema";
import { standardSchemaProblemHook } from "hono-problem-details/standard-schema";
import { valibotProblemHook } from "hono-problem-details/valibot";
import { zodProblemHook } from "hono-problem-details/zod";

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

const _autoCodeRegistry = createProblemTypeRegistry(
	{
		ORDER_CONFLICT: {
			type: "https://example.com/problems/order-conflict",
			status: 409,
			title: "Order Conflict",
			code: "order-conflict",
		},
	},
	{ autoCode: true },
);
const _autoCodeError: ProblemDetailsError = _autoCodeRegistry.create("ORDER_CONFLICT");

const _phrase: string | undefined = statusToPhrase(404);
const _slug: string | undefined = statusToSlug(404);

const _zodHook = zodProblemHook();
const _valibotHook = valibotProblemHook();
const _standardHook = standardSchemaProblemHook();
const _problemSchema = getProblemDetailsSchema();
const _problemSchemaFactory = createProblemDetailsSchema;
const _problemResponse = problemDetailsResponse;
const _extensionSchema: JsonSchemaObject = { type: "array", items: { type: "string" } };
const _problemJsonSchema: ProblemDetailsJsonSchema = problemDetailsJsonSchema({
	extensions: { errors: _extensionSchema },
});
const _problemJsonSchemaResponse = problemDetailsResponseJsonSchema(
	422,
	undefined,
	_extensionSchema,
);

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
void _problemJsonSchema;
void _problemJsonSchemaResponse;
