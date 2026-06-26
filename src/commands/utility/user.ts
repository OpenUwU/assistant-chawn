/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import {
	ApplicationIntegrationType,
	InteractionContextType,
	MediaGalleryBuilder,
	MessageFlags,
	SlashCommandBuilder,
	type User,
} from "discord.js";
import type { Command } from "../../types/index.js";
import {
	baseContainer,
	baseSection,
	errorContainer,
	TextDisplay,
	Thumbnail,
} from "../../utils/components.js";

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
	TeamPseudoUser: "Team User",
	VerifiedBot: "Verified Bot",
	VerifiedDeveloper: "Early Verified Bot Developer",
	CertifiedModerator: "Moderator Programs Alumni",
	ActiveDeveloper: "Active Developer",
	BotHTTPInteractions: "HTTP Interactions Bot",
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
				components: [errorContainer("Could not fetch that user.")],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		const flags = fullUser.flags?.toArray() ?? [];
		const badges = flags.map((f) => FLAG_NAMES[f] ?? f).join(", ") || "None";
		const primaryGuild = fullUser.primaryGuild;

		const identity = [
			`### ${fullUser.globalName ?? fullUser.username}`,
			fullUser.globalName ? `**Username:** ${fullUser.username}` : null,
			`**ID:** \`${fullUser.id}\``,
			`**Tag:** ${fullUser.tag}`,
			`**Bot:** ${fullUser.bot ? "Yes" : "No"}`,
			fullUser.system ? "**System:** Yes" : null,
		]
			.filter(Boolean)
			.join("\n");

		const details = [
			`> **Created:** <t:${Math.floor(fullUser.createdTimestamp / 1000)}:R> (<t:${Math.floor(fullUser.createdTimestamp / 1000)}:D>)`,
			primaryGuild?.tag
				? `> **Server Tag:** ${primaryGuild.tag}${primaryGuild.identityGuildId ? ` (\`${primaryGuild.identityGuildId}\`)` : ""}`
				: null,
			`> **Badges:** ${badges}`,
		]
			.filter(Boolean)
			.join("\n");
		const container = baseContainer().addSectionComponents(
			baseSection()
				.addTextDisplayComponents(TextDisplay(identity))
				.setThumbnailAccessory(
					Thumbnail(
						"user's avatar",
						fullUser.displayAvatarURL() ?? fullUser.defaultAvatarURL,
					),
				)
				.addTextDisplayComponents(TextDisplay(details)),
		);

		const banner = fullUser.bannerURL({ size: 1024 });
		if (banner)
			container.addMediaGalleryComponents(
				new MediaGalleryBuilder().addItems((media) =>
					media.setDescription("user's banner").setURL(banner),
				),
			);

		if (fullUser.accentColor) container.setAccentColor(fullUser.accentColor);

		await interaction.editReply({
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});
	},
};

export default command;
