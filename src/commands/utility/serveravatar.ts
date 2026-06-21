import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	InteractionContextType,
	SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../../types/index.js";
import { errorEmbed } from "../../utils/embeds.js";

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("serveravatar")
		.setDescription("Get a user's avatar in this server.")
		.addUserOption((opt) =>
			opt
				.setName("user")
				.setDescription("The user to get the server avatar of")
				.setRequired(true),
		)
		.setIntegrationTypes(
			ApplicationIntegrationType.GuildInstall,
			ApplicationIntegrationType.UserInstall,
		)
		.setContexts(
			InteractionContextType.Guild,
			InteractionContextType.BotDM,
			InteractionContextType.PrivateChannel,
		),
	execute: async (interaction) => {
		const user = interaction.options.getUser("user", true);

		if (!interaction.inCachedGuild()) {
			await interaction.editReply({
				embeds: [
					errorEmbed(
						"This command can only be used in a server i have been invited to. if you are using this as a user-installed bot, use commands which don't require server data.",
					),
				],
			});
			return;
		}

		try {
			const member = await interaction.guild.members.fetch(user.id);
			const isAnimated = member.avatar?.startsWith("a_") ?? false;
			const extension = isAnimated ? "gif" : "png";

			const avatar1024 = member.displayAvatarURL({ size: 1024, extension });
			const avatar2048 = member.displayAvatarURL({ size: 2048, extension });
			const avatar4096 = member.displayAvatarURL({ size: 4096, extension });

			const res = await fetch(avatar1024);
			const arrayBuffer = await res.arrayBuffer();
			const attachment = new AttachmentBuilder(Buffer.from(arrayBuffer), {
				name: `serveravatar.${extension}`,
			});

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setLabel("1024px")
					.setStyle(ButtonStyle.Link)
					.setURL(avatar1024),
				new ButtonBuilder()
					.setLabel("2048px")
					.setStyle(ButtonStyle.Link)
					.setURL(avatar2048),
				new ButtonBuilder()
					.setLabel("4096px")
					.setStyle(ButtonStyle.Link)
					.setURL(avatar4096),
			);

			await interaction.editReply({
				content: member.avatar
					? `${user.username}'s server avatar:`
					: `${user.username} has no server-specific avatar — showing their global avatar:`,
				files: [attachment],
				components: [row],
			});
		} catch {
			await interaction.editReply({
				embeds: [
					errorEmbed(
						"Something went wrong fetching that server avatar. Try again shortly.",
					),
				],
			});
		}
	},
};

export default command;
