/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ClientEvents } from "discord.js";
import type { ExtendedClient } from "../client.js";
import type { BotEvent, RawBotEvent } from "../types/index.js";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCRIPT_EXT = __filename.endsWith(".ts") ? ".ts" : ".js";

/**
 * Loads every event module under src/events (flat directory) and binds it
 * to the correct emitter via `.on` / `.once` depending on the module's `once` flag.

 */
export async function loadEvents(client: ExtendedClient): Promise<void> {
	const eventsDir = join(__dirname, "..", "events");
	const files = readdirSync(eventsDir).filter(
		(f) => f.endsWith(SCRIPT_EXT) && !f.endsWith(".d.ts"),
	);

	let clientCount = 0;

	for (const file of files) {
		const fullPath = join(eventsDir, file);
		const imported = await import(pathToFileURL(fullPath).href);

		if (
			!imported.default?.name ||
			typeof imported.default.execute !== "function"
		) {
			logger.warn(`Skipped invalid event module: ${file}`);
			continue;
		}

		const event = imported.default as BotEvent | RawBotEvent;
		const name = event.name as keyof ClientEvents;
		const exec = event.execute as (
			...args: unknown[]
		) => Promise<void> | void;

		if (event.once) {
			client.once(name, (...args) => exec(...args));
		} else {
			client.on(name, (...args) => exec(...args));
		}

		clientCount++;
	}

	logger.info(`Loaded ${clientCount} client event(s).`);
}
