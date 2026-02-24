import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		"integrations/zod": "src/integrations/zod.ts",
		"integrations/valibot": "src/integrations/valibot.ts",
		"integrations/openapi": "src/integrations/openapi.ts",
	},
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	sourcemap: true,
	external: [
		"hono",
		"zod",
		"@hono/zod-openapi",
		"@hono/zod-validator",
		"@hono/valibot-validator",
		"valibot",
	],
});
