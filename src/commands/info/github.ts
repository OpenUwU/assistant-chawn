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
import { ActionRow, linkButton } from "../../utils/components.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("github")
		.setDescription("Get a link to the github repository of bot source code.")
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
					linkButton("OpenUwU", "https://github.com/openUwU/"),
					linkButton(
						"Assistant Chawn",
						"https://github.com/openUwU/assistant-chawn",
					),
				),
			],
		});
	},
};

export default command;
