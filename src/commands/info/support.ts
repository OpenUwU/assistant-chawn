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
import type { Command } from "../../types/index.js";
import { ActionRow, linkButton } from "../../utils/components.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("support")
		.setDescription("Get a link to the support server.")
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
		await interaction.editReply({
			components: [
				ActionRow().addComponents(
					linkButton("Support Server", "https://discord.gg/nEbRPnxWtT"),
				),
			],
			flags: MessageFlags.IsComponentsV2,
		});
	},
};

export default command;
