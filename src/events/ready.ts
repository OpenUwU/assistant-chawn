/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ActivityType, Events } from "discord.js";
import type { ExtendedClient } from "../client.js";
import type { BotEvent, Command } from "../types/index.js";
import { isRestrictiveModeEnabled } from "../utils/access.js";
import { logger } from "../utils/logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function walk(dir: string): string[] {
	let files: string[] = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) {
			files = files.concat(walk(full));
		} else if (entry.endsWith(".js") || entry.endsWith(".ts")) {
			files.push(full);
		}
	}
	return files;
}

async function deployCommands(client: ExtendedClient): Promise<void> {
	const restrictive = isRestrictiveModeEnabled();
	const commandsDir = join(__dirname, "../commands");
	const files = walk(commandsDir);

	const payload: ReturnType<Command["data"]["toJSON"]>[] = [];

	for (const file of files) {
		const mod = await import(pathToFileURL(file).href);
		const command: Command | undefined = mod.default;
		if (!command?.data) continue;

		if (!restrictive && command.ownerOnly) continue;

		payload.push(command.data.toJSON());
	}

	try {
		logger.info(`Deploying ${payload.length} command(s)...`);
		await client.application?.commands.set(payload);
		logger.info("Commands deployed.");
	} catch (err) {
		logger.error(`Deploy failed: ${err}`);
	}
}

const event: BotEvent<typeof Events.ClientReady> = {
	name: Events.ClientReady,
	once: true,
	execute: async (client) => {
		const extClient = client as ExtendedClient;
		logger.info(`Logged in as ${extClient.user?.tag}`);

		extClient.user?.setPresence({
			activities: [{ name: "lund lele", type: ActivityType.Listening }],
			status: "online",
		});

		await deployCommands(extClient);
	},
};

export default event;
