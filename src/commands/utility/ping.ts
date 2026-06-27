/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import {
	ApplicationIntegrationType,
	InteractionContextType,
	SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../../types/index.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Check the bot latency.")
		.setIntegrationTypes(
			ApplicationIntegrationType.UserInstall,
			ApplicationIntegrationType.GuildInstall,
		)
		.setContexts(
			InteractionContextType.Guild,
			InteractionContextType.BotDM,
			InteractionContextType.PrivateChannel,
		),

	execute: async (interaction) => {
		const roundtrip = Date.now() - interaction.createdTimestamp;
		const client = interaction.client;
		let MsgContent = `>>> 🏓 Pong! \n Websocket: ${client.ws.ping}ms (Roundtrip: ${roundtrip}ms) `;
		if (client.readyTimestamp) {
			MsgContent += `\n Ready since  <t:${Math.floor(client.readyTimestamp / 1000)}:F>`;
		}
		await interaction.editReply({
			content: MsgContent,
		});
	},
};

export default command;
