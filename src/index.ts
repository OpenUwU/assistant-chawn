/*/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import "dotenv/config";
import { ExtendedClient } from "./client.js";
import { closePool, closeRedis, hydrateAll } from "./db/index.js";
import { loadCommands } from "./handlers/commandHandler.js";
import { loadEvents } from "./handlers/eventHandler.js";
import { logger } from "./utils/logger.js";

const client = new ExtendedClient();

async function bootstrap(): Promise<void> {
	const token = process.env.DISCORD_TOKEN;
	if (!token) throw new Error("DISCORD_TOKEN is missing from .env");

	await hydrateAll();

	await loadCommands(client);
	await loadEvents(client);

	await client.login(token);
}

async function shutdown(signal: string): Promise<void> {
	logger.info(`Received ${signal}, shutting down…`);
	client.destroy();
	await Promise.allSettled([closePool(), closeRedis()]);
	process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

bootstrap().catch((err) => {
	logger.error(`Fatal error during bootstrap: ${err}`);
	process.exit(1);
});

process.on("unhandledRejection", (reason) => {
	logger.error(`Unhandled rejection: ${reason}`);
});
