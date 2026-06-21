import {
	ApplicationIntegrationType,
	InteractionContextType,
	SlashCommandBuilder,
	type User,
} from "discord.js";
import type { Command } from "../../types/index.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds.js";

const FLAG_NAMES: Record<string, string> = {
	Staff: "Discord Staff",
	Partner: "Partnered Server Owner",
	Hypesquad: "HypeSquad Events",
	BugHunterLevel1: "Bug Hunter",
	BugHunterLevel2: "Bug Hunter (Gold)",
	HypeSquadOnlineHouse1: "House Bravery",
	HypeSquadOnlineHouse2: "House Brilliance",
	HypeSquadOnlineHouse3: "House Balance",
	PremiumEarlySupporter: "Early Supporter",
	VerifiedBot: "Verified Bot",
	VerifiedDeveloper: "Early Verified Bot Developer",
	CertifiedModerator: "Moderator Programs Alumni",
	ActiveDeveloper: "Active Developer",
};

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("user")
		.setDescription("view a Discord user's profile")
		.addUserOption((opt) =>
			opt.setName("user").setDescription("the user to look up"),
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
		const target = interaction.options.getUser("user") ?? interaction.user;

		let fullUser: User;
		try {
			fullUser = await interaction.client.users.fetch(target.id, {
				force: true,
			});
		} catch {
			await interaction.editReply({
				embeds: [errorEmbed("Could not fetch that user.")],
			});
			return;
		}

		const flags = fullUser.flags?.toArray() ?? [];
		const badges = flags.map((f) => FLAG_NAMES[f] ?? f).join(", ") || "None";

		const embed = baseEmbed()
			.setTitle(fullUser.username)
			.setThumbnail(fullUser.displayAvatarURL({ size: 512 }))
			.addFields(
				{ name: "ID", value: fullUser.id, inline: true },
				{ name: "Bot", value: fullUser.bot ? "Yes" : "No", inline: true },
				{
					name: "Created",
					value: `<t:${Math.floor(fullUser.createdTimestamp / 1000)}:R>`,
					inline: true,
				},
				{ name: "Badges", value: badges },
			);

		const banner = fullUser.bannerURL({ size: 1024 });
		if (banner) embed.setImage(banner);
		if (fullUser.accentColor) embed.setColor(fullUser.accentColor);

		const member = interaction.guild?.members.cache.get(fullUser.id);
		if (member) {
			embed.addFields(
				{
					name: "Joined Server",
					value: member.joinedTimestamp
						? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
						: "Unknown",
					inline: true,
				},
				{
					name: "Nickname",
					value: member.nickname ?? "None",
					inline: true,
				},
			);
		}

		await interaction.editReply({ embeds: [embed] });
	},
};

export default command;
