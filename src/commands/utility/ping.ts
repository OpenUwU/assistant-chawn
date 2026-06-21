import {
	ApplicationIntegrationType,
	InteractionContextType,
	SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../../types/index.js";
import { baseEmbed } from "../../utils/embeds.js";

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

	execute: async (interaction, client) => {
		const start = Date.now();
		await interaction.deferReply();
		const roundtrip = Date.now() - start;

		const embed = baseEmbed()
			.setTitle("Pong!")
			.addFields(
				{ name: "Roundtrip", value: `${roundtrip}ms`, inline: true },
				{ name: "WebSocket", value: `${client.ws.ping}ms`, inline: true },
			);

		await interaction.editReply({ embeds: [embed] });
	},
};

export default command;
