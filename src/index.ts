/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import "dotenv/config";
import { ExtendedClient } from "./client.js";
import { loadCommands } from "./handlers/commandHandler.js";
import { loadEvents } from "./handlers/eventHandler.js";
import { logger } from "./utils/logger.js";

const client = new ExtendedClient();

async function bootstrap(): Promise<void> {
	await loadCommands(client);
	await loadEvents(client);

	const token = process.env.DISCORD_TOKEN;
	if (!token) {
		throw new Error(
			"DISCORD_TOKEN is missing from your environment (.env file).",
		);
	}

	await client.login(token);
}

bootstrap().catch((err) => {
	logger.error(`Fatal error during bootstrap: ${err}`);
	process.exit(1);
});

process.on("unhandledRejection", (reason) => {
	logger.error(`Unhandled rejection: ${reason}`);
});
