import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		"integrations/zod": "src/integrations/zod.ts",
		"integrations/valibot": "src/integrations/valibot.ts",
		"integrations/openapi": "src/integrations/openapi.ts",
		"integrations/openapi-json-schema": "src/integrations/openapi-json-schema.ts",
		"integrations/standard-schema": "src/integrations/standard-schema.ts",
	},
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	sourcemap: false,
	external: [
		"hono",
		"zod",
		"@hono/zod-openapi",
		"@hono/zod-validator",
		"@hono/valibot-validator",
		"valibot",
		"@hono/standard-validator",
		"@standard-schema/spec",
		"@opentelemetry/api",
	],
});
