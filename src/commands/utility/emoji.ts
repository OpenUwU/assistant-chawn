import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
	InteractionContextType,
	SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../../types/index.js";
import { errorEmbed } from "../../utils/embeds.js";

interface EmojiMatch {
	id: string;
	ext: string;
	animated: boolean;
}

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("emoji")
		.setDescription("get the CDN URL of a Discord emoji")
		.addStringOption((opt) =>
			opt.setName("emoji").setDescription("the emoji").setRequired(true),
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
		const input = interaction.options.getString("emoji", true);
		const match = input.match(/<(?<animated>a)?:(?<name>\w+):(?<id>\d+)>/);

		if (!match?.groups) {
			await interaction.editReply({
				embeds: [errorEmbed("That doesn't look like a custom emoji.")],
			});
			return;
		}

		const { animated, name, id } = match.groups;
		const ext = animated ? "gif" : "png";
		const url = `https://cdn.discordapp.com/emojis/${id}.${ext}?quality=lossless&`;
		await interaction.editReply({
			content: `Name: ${name}, ${animated ? "is" : "is not"} animated`,
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents([
					new ButtonBuilder()
						.setLabel("View(512x512)")
						.setStyle(ButtonStyle.Link)
						.setURL(`${url}size=512`),
					new ButtonBuilder()
						.setLabel("View(1024x1024)")
						.setStyle(ButtonStyle.Link)
						.setURL(`${url}size=1024`),
					new ButtonBuilder()
						.setLabel("View(2048x2048)")
						.setStyle(ButtonStyle.Link)
						.setURL(`${url}size=2048`),
				]),
			],
		});
	},
};

export default command;
