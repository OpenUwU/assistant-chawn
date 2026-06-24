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
import {
	grantAccess,
	listAuthorized,
	revokeAccess,
} from "../../db/accessStore.js";
import type { Command } from "../../types/index.js";
import { isRestrictiveModeEnabled } from "../../utils/access.js";
import {
	baseContainer,
	errorContainer,
	Separator,
	TextDisplay,
} from "../../utils/components.js";

const command: Command = {
	ownerOnly: true,
	data: new SlashCommandBuilder()
		.setName("allow")
		.setDescription("Manage who can use restricted commands. (Owner only)")
		.addSubcommand((sub) =>
			sub
				.setName("grant")
				.setDescription("Grant a user access to restricted commands.")
				.addUserOption((o) =>
					o
						.setName("user")
						.setDescription("User to grant")
						.setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName("revoke")
				.setDescription("Revoke a user's access.")
				.addUserOption((o) =>
					o
						.setName("user")
						.setDescription("User to revoke")
						.setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub.setName("list").setDescription("List all authorized users."),
		)
		.setIntegrationTypes(ApplicationIntegrationType.UserInstall)
		.setContexts(
			InteractionContextType.Guild,
			InteractionContextType.BotDM,
			InteractionContextType.PrivateChannel,
		),

	execute: async (interaction) => {
		if (!isRestrictiveModeEnabled()) {
			await interaction.editReply({
				components: [errorContainer("Restrictive mode is not enabled.")],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		const sub = interaction.options.getSubcommand();

		if (sub === "grant") {
			const target = interaction.options.getUser("user", true);

			if (target.bot) {
				await interaction.editReply({
					components: [errorContainer("Cannot grant access to bots.")],
					flags: MessageFlags.IsComponentsV2,
				});
				return;
			}

			await grantAccess(target.id, interaction.user.id);
			await interaction.editReply({
				components: [
					baseContainer().addTextDisplayComponents(
						TextDisplay(`Access granted to <@${target.id}>.`),
					),
				],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		if (sub === "revoke") {
			const target = interaction.options.getUser("user", true);
			await revokeAccess(target.id);
			await interaction.editReply({
				components: [
					baseContainer().addTextDisplayComponents(
						TextDisplay(`Access revoked for <@${target.id}>.`),
					),
				],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		if (sub === "list") {
			const users = await listAuthorized();

			if (users.length === 0) {
				await interaction.editReply({
					components: [errorContainer("No authorized users.")],
					flags: MessageFlags.IsComponentsV2,
				});
				return;
			}

			const lines = users
				.map(
					(u) =>
						`<@${u.userId}> — granted by <@${u.grantedBy}> <t:${Math.floor(u.grantedAt / 1000)}:R>`,
				)
				.join("\n");

			await interaction.editReply({
				components: [
					baseContainer()
						.addTextDisplayComponents(TextDisplay("### Authorized Users"))
						.addSeparatorComponents(Separator())
						.addTextDisplayComponents(TextDisplay(lines)),
				],
				flags: MessageFlags.IsComponentsV2,
			});
		}
	},
};

export default command;
