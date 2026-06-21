import "dotenv/config";
import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { REST, Routes } from "discord.js";
import type { Command } from "./types/index.js";
import { logger } from "./utils/logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function walk(dir: string): string[] {
	let files: string[] = [];
	for (const entry of readdirSync(dir)) {
		const fullPath = join(dir, entry);
		if (statSync(fullPath).isDirectory())
			files = files.concat(walk(fullPath));
		else if (entry.endsWith(".js")) files.push(fullPath);
	}
	return files;
}

async function deploy(): Promise<void> {
	const token = process.env.DISCORD_TOKEN;
	const clientId = process.env.CLIENT_ID;

	if (!token || !clientId) {
		throw new Error(
			"DISCORD_TOKEN and CLIENT_ID must both be set in your .env file.",
		);
	}

	const commandsDir = join(__dirname, "commands");
	const files = walk(commandsDir);
	// biome-ignore lint/suspicious/noExplicitAny: false positive
	const payload: any[] = [];

	for (const file of files) {
		const imported = await import(pathToFileURL(file).href);
		const command: Command | undefined = imported.default;
		if (command?.data) payload.push(command.data.toJSON());
	}

	const rest = new REST().setToken(token);

	logger.info(`Deploying ${payload.length} global command(s)...`);
	await rest.put(Routes.applicationCommands(clientId), { body: payload });
	logger.info(
		"Done. Global commands can take up to ~1 hour to propagate everywhere.",
	);
}

deploy().catch((err) => {
	logger.error(`Deploy failed: ${err}`);
	process.exit(1);
});
