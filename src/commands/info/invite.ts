/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import {
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { ExtendedClient } from "../../client.js";
import type { Command } from "../../types/index.js";
import { ActionRow, linkButton } from "../../utils/components.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("invite")
		.setDescription("Get a link to install the bot.")
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
		const client = interaction.client as ExtendedClient;
		const clientId = client.user?.id;
		const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}`;

		await interaction.editReply({
			components: [
				ActionRow().addComponents(linkButton("Install", inviteUrl)),
			],
			flags: MessageFlags.IsComponentsV2,
		});
	},
};

export default command;
