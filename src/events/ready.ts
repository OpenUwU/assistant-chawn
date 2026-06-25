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
function getDevGuildIDs(): Set<string> {
	const raw = process.env.OWNER_GUILDS ?? "";
	return new Set(
		raw
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean),
	);
}

async function deployCommands(client: ExtendedClient): Promise<void> {
	const commandsDir = join(__dirname, "../commands");
	const files = walk(commandsDir);

	const payload: ReturnType<Command["data"]["toJSON"]>[] = [];
	const devPayload: ReturnType<Command["data"]["toJSON"]>[] = [];

	for (const file of files) {
		const mod = await import(pathToFileURL(file).href);
		const command: Command | undefined = mod.default;
		if (!command?.data) continue;

		if (command.ownerOnly) {
			devPayload.push(command.data.toJSON());
			continue;
		}

		payload.push(command.data.toJSON());
	}

	try {
		logger.info(`Deploying ${payload.length} global command(s)...`);
		await client.application?.commands.set(payload);

		logger.info(`Deploying ${devPayload.length} dev command(s)...`);
		const devGuilds = getDevGuildIDs();

		for (const guildId of devGuilds) {
			try {
				const guild = await client.guilds.fetch(guildId);
				await guild.commands.set(devPayload);
				logger.info(
					`Successfully deployed dev commands to guild: ${guildId}`,
				);
			} catch (guildErr) {
				logger.error(
					`Failed to deploy to guild ${guildId}. Is the app authorized there? Error: ${guildErr}`,
				);
			}
		}

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
