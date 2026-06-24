/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	InteractionContextType,
	type Invite,
	MediaGalleryBuilder,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { ExtendedClient } from "../../client.js";
import type { Command } from "../../types/index.js";
import {
	baseContainer,
	baseSection,
	errorContainer,
	Separator,
	TextDisplay,
	Thumbnail,
} from "../../utils/components.js";

const COLLECTOR_TIMEOUT_MS = 5 * 60 * 1000;

// Feature categories
const FEATURE_CATEGORIES: Record<string, string[]> = {
	Verification: ["VERIFIED", "PARTNERED", "DEVELOPER_SUPPORT_SERVER"],
	Discovery: [
		"COMMUNITY",
		"DISCOVERABLE",
		"FEATURABLE",
		"PREVIEW_ENABLED",
		"WELCOME_SCREEN_ENABLED",
	],
	Monetization: [
		"CREATOR_MONETIZABLE_PROVISIONAL",
		"CREATOR_STORE_PAGE",
		"ROLE_SUBSCRIPTIONS_ENABLED",
		"ROLE_SUBSCRIPTIONS_AVAILABLE_FOR_PURCHASE",
		"TICKETED_EVENTS_ENABLED",
	],
	Cosmetics: [
		"ANIMATED_BANNER",
		"ANIMATED_ICON",
		"BANNER",
		"INVITE_SPLASH",
		"ROLE_ICONS",
		"ENHANCED_ROLE_COLORS",
		"VANITY_URL",
	],
	Audio: ["VIP_REGIONS", "SOUNDBOARD", "MORE_SOUNDBOARD"],
	Moderation: [
		"AUTO_MODERATION",
		"MEMBER_VERIFICATION_GATE_ENABLED",
		"RAID_ALERTS_DISABLED",
		"INVITES_DISABLED",
	],
	Other: [
		"NEWS",
		"MORE_STICKERS",
		"GUESTS_ENABLED",
		"GUILD_TAGS",
		"APPLICATION_COMMAND_PERMISSIONS_V2",
	],
};

const FEATURE_NAMES: Record<string, string> = {
	ANIMATED_BANNER: "Animated Banner",
	ANIMATED_ICON: "Animated Icon",
	APPLICATION_COMMAND_PERMISSIONS_V2: "Legacy Command Permissions",
	AUTO_MODERATION: "Auto Moderation",
	BANNER: "Server Banner",
	COMMUNITY: "Community Server",
	CREATOR_MONETIZABLE_PROVISIONAL: "Monetization Enabled",
	CREATOR_STORE_PAGE: "Role Subscription Promo Page",
	DEVELOPER_SUPPORT_SERVER: "App Directory Support Server",
	DISCOVERABLE: "Server Discovery",
	FEATURABLE: "Directory Featurable",
	INVITES_DISABLED: "Invites Paused",
	INVITE_SPLASH: "Invite Splash",
	MEMBER_VERIFICATION_GATE_ENABLED: "Membership Screening",
	MORE_SOUNDBOARD: "Extra Soundboard Slots",
	MORE_STICKERS: "Extra Sticker Slots",
	NEWS: "Announcement Channels",
	PARTNERED: "Partnered",
	PREVIEW_ENABLED: "Server Preview",
	RAID_ALERTS_DISABLED: "Raid Alerts Disabled",
	ROLE_ICONS: "Role Icons",
	ROLE_SUBSCRIPTIONS_AVAILABLE_FOR_PURCHASE: "Role Subscriptions Available",
	ROLE_SUBSCRIPTIONS_ENABLED: "Role Subscriptions",
	SOUNDBOARD: "Custom Soundboard",
	TICKETED_EVENTS_ENABLED: "Ticketed Events",
	VANITY_URL: "Vanity URL",
	VERIFIED: "Verified",
	VIP_REGIONS: "384kbps Audio",
	WELCOME_SCREEN_ENABLED: "Welcome Screen",
	GUESTS_ENABLED: "Guest Invites",
	GUILD_TAGS: "Guild Tags",
	ENHANCED_ROLE_COLORS: "Gradient Role Colors",
};

function isAnInvite(text: string): boolean {
	return /^(https?:\/\/)?(www\.)?(discord\.(gg|li|me|io)|discordapp\.com\/invite)\/.+/.test(
		text,
	);
}

function truncate(text: string, length: number): string {
	if (text.length > length) return `${text.slice(0, length - 3)}...`;
	return text;
}

function formatFeature(feature: string): string {
	return (
		FEATURE_NAMES[feature] ??
		feature
			.toLowerCase()
			.split("_")
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(" ")
	);
}

function buildFeaturesPage(activeFeatures: string[]): string {
	if (activeFeatures.length === 0) return "> None";

	const activeSet = new Set(activeFeatures);
	const lines: string[] = [];
	const uncategorized: string[] = [];

	for (const [category, keys] of Object.entries(FEATURE_CATEGORIES)) {
		const matched = keys.filter((k) => activeSet.has(k));
		if (matched.length === 0) continue;
		lines.push(`**${category}**`);
		for (const k of matched) {
			lines.push(`> ${formatFeature(k)}`);
			activeSet.delete(k);
		}
	}

	// anything not in any category
	for (const f of activeSet) uncategorized.push(f);
	if (uncategorized.length) {
		lines.push("**Misc**");
		for (const f of uncategorized) lines.push(`> ${formatFeature(f)}`);
	}

	return lines.join("\n");
}

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("server")
		.setDescription("server related commands")
		.addSubcommand((sub) =>
			sub
				.setName("invite-info")
				.setDescription("get info about an invite link")
				.addStringOption((opt) =>
					opt
						.setName("invite")
						.setDescription("the invite link")
						.setRequired(true),
				),
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
		const extClient = interaction.client as ExtendedClient;
		const invite = interaction.options.getString("invite", true);

		if (!isAnInvite(invite)) {
			await interaction.editReply({
				components: [
					errorContainer("That doesn't look like a valid invite link."),
				],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		let inviteObj: Invite;
		try {
			inviteObj = await extClient.fetchInvite(invite);
		} catch {
			await interaction.editReply({
				components: [
					errorContainer("That doesn't look like a valid invite link."),
				],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		const guild = inviteObj.guild;
		const activeFeatures = guild?.features ?? [];
		const hasFeatures = activeFeatures.length > 0;

		// page 0 = info, page 1 = features
		let page = 0;
		const TOTAL_PAGES = hasFeatures ? 2 : 1;

		const iconURL = guild?.iconURL() ?? null;
		const bannerURL = guild?.bannerURL({ size: 1024 }) ?? null;
		const description = truncate(guild?.description ?? "None", 1024);
		const vanity = guild?.vanityURLCode ?? "None";

		const infoText = [
			`> **Server ID:** \`${guild?.id ?? "Unknown"}\``,
			`> **Members:** ${inviteObj.memberCount ?? "Unknown"} (${inviteObj.presenceCount ?? "?"} online)`,
			`> **Boosts:** ${guild?.premiumSubscriptionCount ?? 0}`,
			`> **Verification:** ${guild?.verificationLevel ?? "None"}`,
			`> **Vanity URL:** ${vanity}`,
			`> **Features:** ${activeFeatures.length}`,
		].join("\n");

		function buildInfoPage() {
			const section = baseSection().addTextDisplayComponents(
				TextDisplay(`### ${guild?.name ?? "Unknown"}`),
				TextDisplay(`>>> ${description}`),
				TextDisplay(infoText),
			);

			if (iconURL)
				section.setThumbnailAccessory(Thumbnail("server icon", iconURL));

			const container = baseContainer().addSectionComponents(section);

			if (bannerURL)
				container.addMediaGalleryComponents(
					new MediaGalleryBuilder().addItems((media) =>
						media.setDescription("server banner").setURL(bannerURL),
					),
				);

			if (hasFeatures)
				container
					.addSeparatorComponents(Separator())
					.addActionRowComponents(
						new ActionRowBuilder<ButtonBuilder>().addComponents(
							new ButtonBuilder()
								.setCustomId("server_features")
								.setLabel("View Features")
								.setStyle(ButtonStyle.Secondary),
						),
					);

			return container;
		}

		function buildFeaturesPageContainer() {
			const container = baseContainer()
				.addTextDisplayComponents(
					TextDisplay(`### ${guild?.name ?? "Unknown"} — Features`),
				)
				.addSeparatorComponents(Separator())
				.addTextDisplayComponents(
					TextDisplay(buildFeaturesPage(activeFeatures)),
				)
				.addSeparatorComponents(Separator())
				.addActionRowComponents(
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId("server_info")
							.setLabel("Back to Info")
							.setStyle(ButtonStyle.Secondary),
					),
				);

			return container;
		}

		function buildPage(disableAll = false) {
			const container =
				page === 0 ? buildInfoPage() : buildFeaturesPageContainer();

			if (disableAll) {
				if (page === 0 && hasFeatures) {
					const section = baseSection().addTextDisplayComponents(
						TextDisplay(`### ${guild?.name ?? "Unknown"}`),
						TextDisplay(`>>> ${description}`),
						TextDisplay(infoText),
					);
					if (iconURL)
						section.setThumbnailAccessory(
							Thumbnail("server icon", iconURL),
						);
					const c = baseContainer().addSectionComponents(section);
					if (bannerURL)
						c.addMediaGalleryComponents(
							new MediaGalleryBuilder().addItems((media) =>
								media.setDescription("server banner").setURL(bannerURL),
							),
						);
					c.addSeparatorComponents(Separator()).addActionRowComponents(
						new ActionRowBuilder<ButtonBuilder>().addComponents(
							new ButtonBuilder()
								.setCustomId("server_features")
								.setLabel("View Features")
								.setStyle(ButtonStyle.Secondary)
								.setDisabled(true),
						),
					);
					return c;
				} else if (page === 1) {
					return baseContainer()
						.addTextDisplayComponents(
							TextDisplay(`### ${guild?.name ?? "Unknown"} — Features`),
						)
						.addSeparatorComponents(Separator())
						.addTextDisplayComponents(
							TextDisplay(buildFeaturesPage(activeFeatures)),
						)
						.addSeparatorComponents(Separator())
						.addActionRowComponents(
							new ActionRowBuilder<ButtonBuilder>().addComponents(
								new ButtonBuilder()
									.setCustomId("server_info")
									.setLabel("Back to Info")
									.setStyle(ButtonStyle.Secondary)
									.setDisabled(true),
							),
						);
				}
			}
			return container;
		}

		const response = await interaction.editReply({
			components: [buildPage()],
			flags: MessageFlags.IsComponentsV2,
		});

		if (TOTAL_PAGES === 1) return;

		const collector = response.createMessageComponentCollector({
			componentType: ComponentType.Button,
			filter: (i) => i.user.id === interaction.user.id,
			time: COLLECTOR_TIMEOUT_MS,
		});

		collector.on("collect", async (i) => {
			if (i.customId === "server_features") page = 1;
			else if (i.customId === "server_info") page = 0;
			else return;

			await i.update({
				components: [buildPage()],
				flags: MessageFlags.IsComponentsV2,
			});
		});

		collector.on("end", async () => {
			try {
				await interaction.editReply({
					components: [buildPage(true)],
					flags: MessageFlags.IsComponentsV2,
				});
			} catch {
				/* message may be gone */
			}
		});
	},
};

export default command;
