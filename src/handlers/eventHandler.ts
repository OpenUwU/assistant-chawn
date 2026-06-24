/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ExtendedClient } from "../client.js";
import type { BotEvent } from "../types/index.js";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCRIPT_EXT = __filename.endsWith(".ts") ? ".ts" : ".js";

/**
 * Loads every event module under src/events (flat directory) and binds it
 * to the client via .on or .once depending on the module's `once` flag.
 */
export async function loadEvents(client: ExtendedClient): Promise<void> {
	const eventsDir = join(__dirname, "..", "events");
	const files = readdirSync(eventsDir).filter(
		(f) => f.endsWith(SCRIPT_EXT) && !f.endsWith(".d.ts"),
	);

	for (const file of files) {
		const fullPath = join(eventsDir, file);
		const imported = await import(pathToFileURL(fullPath).href);
		const event: BotEvent | undefined = imported.default;

		if (!event?.name || typeof event.execute !== "function") {
			logger.warn(`Skipped invalid event module: ${file}`);
			continue;
		}

		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args));
		} else {
			client.on(event.name, (...args) => event.execute(...args));
		}
	}

	logger.info(`Loaded ${files.length} event(s).`);
}
