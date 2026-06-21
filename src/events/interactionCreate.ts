import { Events, type Interaction } from "discord.js";
import type { ExtendedClient } from "../client.js";
import type { BotEvent } from "../types/index.js";
import { errorEmbed } from "../utils/embeds.js";
import { logger } from "../utils/logger.js";

const event: BotEvent<typeof Events.InteractionCreate> = {
	name: Events.InteractionCreate,
	execute: async (interaction: Interaction) => {
		if (!interaction.isChatInputCommand()) return;

		const client = interaction.client as ExtendedClient;
		const command = client.commands.get(interaction.commandName);

		if (!command) {
			logger.warn(`Received unknown command: ${interaction.commandName}`);
			return;
		}
		try {
			await command.execute(interaction, client);
		} catch (err) {
			logger.error(
				`Error executing /${command.data.name}: ${(err as Error).stack ?? err}`,
			);
			const payload = {
				embeds: [errorEmbed("Something went wrong running that command.")],
				ephemeral: true,
			};
			if (interaction.deferred || interaction.replied) {
				await interaction.editReply(payload);
			} else {
				await interaction.reply(payload);
			}
		}
	},
};

export default event;
