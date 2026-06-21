import { ActivityType, Events } from "discord.js";
import type { ExtendedClient } from "../client.js";
import type { BotEvent } from "../types/index.js";
import { logger } from "../utils/logger.js";

const event: BotEvent<typeof Events.ClientReady> = {
	name: Events.ClientReady,
	once: true,
	execute: (client) => {
		const extClient = client as ExtendedClient;
		logger.info(`Logged in as ${extClient.user?.tag}`);
		extClient.user?.setPresence({
			activities: [{ name: "lund lele", type: ActivityType.Listening }],
			status: "online",
		});
	},
};

export default event;
