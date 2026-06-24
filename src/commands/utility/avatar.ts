/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import {
	ApplicationIntegrationType,
	AttachmentBuilder,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../../types/index.js";
import {
	ActionRow,
	errorContainer,
	linkButton,
} from "../../utils/components.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("avatar")
		.setDescription("Get a user's avatar.")
		.addUserOption((opt) =>
			opt
				.setName("user")
				.setDescription("The user to get the avatar of")
				.setRequired(true),
		)
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
		const user = interaction.options.getUser("user", true);
		try {
			const isAnimated = user.avatar?.startsWith("a_") ?? false;
			const extension = isAnimated ? "gif" : "png";

			const avatar1024 = user.displayAvatarURL({ size: 1024, extension });
			const avatar2048 = user.displayAvatarURL({ size: 2048, extension });
			const avatar4096 = user.displayAvatarURL({ size: 4096, extension });

			const res = await fetch(avatar1024);
			const arrayBuffer = await res.arrayBuffer();
			const attachment = new AttachmentBuilder(Buffer.from(arrayBuffer), {
				name: `avatar.${extension}`,
			});

			const row = ActionRow().addComponents(
				linkButton("1024x", avatar1024),
				linkButton("2048x", avatar2048),
				linkButton("4096x", avatar4096),
			);

			await interaction.editReply({
				content: `${user.username}'s avatar:`,
				files: [attachment],
				components: [row],
			});
		} catch {
			await interaction.editReply({
				components: [
					errorContainer(
						"Something went wrong fetching that avatar. Try again shortly.",
					),
				],
				flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
			});
		}
	},
};

export default command;
