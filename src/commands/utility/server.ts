import {
	ApplicationIntegrationType,
	InteractionContextType,
	type Invite,
	SlashCommandBuilder,
} from "discord.js";
import type { ExtendedClient } from "../../client.js";
import type { Command } from "../../types/index.js";
import { baseEmbed, errorEmbed } from "../../utils/components.js";

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
	if (text.length > length) {
		return `${text.slice(0, length - 3)}...`;
	}
	return text;
}

function formatFeature(feature: string): string {
	if (FEATURE_NAMES[feature]) return FEATURE_NAMES[feature];
	return feature
		.toLowerCase()
		.split("_")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}

function formatFeatures(features: string[], max = 8): string {
	if (features.length === 0) return "None";
	const shown = features.slice(0, max).map(formatFeature);
	const extra = features.length - max;
	return shown.join(", ") + (extra > 0 ? `, +${extra} more` : "");
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
		const subcommand = interaction.options.getSubcommand(true);
		const extClient = interaction.client as ExtendedClient;

		if (subcommand !== "invite-info") {
			await interaction.editReply({
				embeds: [errorEmbed("Unknown subcommand.")],
			});
			return;
		}

		const invite = interaction.options.getString("invite", true);

		if (!isAnInvite(invite)) {
			await interaction.editReply({
				embeds: [errorEmbed("That doesn't look like a valid invite link.")],
			});
			return;
		}

		let inviteObj: Invite;
		try {
			inviteObj = await extClient.fetchInvite(invite);
		} catch {
			await interaction.editReply({
				embeds: [errorEmbed("That doesn't look like a valid invite link.")],
			});
			return;
		}

		const guild = inviteObj.guild;
		const banner = guild?.bannerURL({ size: 1024 }) ?? null;
		const avatar = guild?.iconURL() ?? null;

		const embed = baseEmbed()
			.setTitle(guild?.name ?? "Unknown")
			.setURL(invite)
			.setDescription(truncate(guild?.description ?? "None", 2048))
			.addFields(
				{
					name: "Server ID",
					value: `${guild?.id}`,
					inline: true,
				},
				{
					name: "Boost Count",
					value: `${guild?.premiumSubscriptionCount ?? 0}`,
					inline: true,
				},
				{
					name: "Verification Level",
					value: `${guild?.verificationLevel ?? "None"}`,
					inline: true,
				},
				{
					name: "Vanity URL",
					value: guild?.vanityURLCode ?? "None",
					inline: true,
				},
				{
					name: "Member Count",
					value: `${inviteObj.memberCount ?? "Unknown"}`,
					inline: true,
				},
				{
					name: "Online Count",
					value: `${inviteObj.presenceCount ?? "Unknown"}`,
					inline: true,
				},
				{
					name: "Features",
					value: formatFeatures(guild?.features ?? []),
				},
			);

		if (banner) {
			embed.setImage(banner);
		} else if (avatar) {
			embed.setThumbnail(avatar);
		}

		await interaction.editReply({
			embeds: [embed],
		});
	},
};

export default command;
