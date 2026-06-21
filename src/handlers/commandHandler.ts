import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ExtendedClient } from "../client.js";
import type { Command } from "../types/index.js";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCRIPT_EXT = __filename.endsWith(".ts") ? ".ts" : ".js";

function walk(dir: string): string[] {
	let files: string[] = [];
	for (const entry of readdirSync(dir)) {
		const fullPath = join(dir, entry);
		if (statSync(fullPath).isDirectory()) {
			files = files.concat(walk(fullPath));
		} else if (entry.endsWith(SCRIPT_EXT) && !entry.endsWith(".d.ts")) {
			files.push(fullPath);
		}
	}
	return files;
}

export async function loadCommands(client: ExtendedClient): Promise<void> {
	const commandsDir = join(__dirname, "..", "commands");
	const files = walk(commandsDir);

	for (const file of files) {
		const imported = await import(pathToFileURL(file).href);
		const command: Command | undefined = imported.default;

		if (!command?.data || typeof command.execute !== "function") {
			logger.warn(`Skipped invalid command module: ${file}`);
			continue;
		}

		client.commands.set(command.data.name, command);
	}

	logger.info(`Loaded ${client.commands.size} command(s).`);
}
