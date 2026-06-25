/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import { Events, type Interaction, MessageFlags } from "discord.js";
import type { ExtendedClient } from "../client.js";
import type { BotEvent } from "../types/index.js";
import {
	checkAccess,
	isOwner,
	isRestrictiveModeEnabled,
} from "../utils/access.js";
import { errorContainer } from "../utils/components.js";
import { applyCooldown, getRemainingCooldown } from "../utils/cooldown.js";
import { logger } from "../utils/logger.js";

const event: BotEvent<typeof Events.InteractionCreate> = {
	name: Events.InteractionCreate,
	execute: async (interaction: Interaction) => {
		const client = interaction.client as ExtendedClient;

		if (interaction.isAutocomplete()) {
			const command = client.commands.get(interaction.commandName);
			if (!command?.autocomplete) return;
			try {
				await command.autocomplete(interaction, client);
			} catch (err) {
				logger.error(
					`Autocomplete error for /${interaction.commandName}: ${err}`,
				);
			}
			return;
		}

		if (!interaction.isChatInputCommand()) return;

		const command = client.commands.get(interaction.commandName);
		if (!command) {
			logger.warn(`Received unknown command: ${interaction.commandName}`);
			return;
		}

		const owner = isOwner(interaction.user.id);

		if (command.ownerOnly && !owner) {
			await interaction.reply({
				components: [errorContainer("This command is owner-only.")],
				flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
			});
			return;
		}

		if (!owner) {
			const remaining = await getRemainingCooldown(interaction.user.id);
			if (remaining > 0) {
				await interaction.reply({
					components: [
						errorContainer(
							`Slow down — try again in ${(remaining / 1000).toFixed(1)}s.`,
						),
					],
					flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
				});
				return;
			}
			await applyCooldown(interaction.user.id);
		}

		if (!command.skipAutoDefer) {
			try {
				await interaction.deferReply({});
			} catch (deferErr) {
				logger.error(
					`Failed to defer /${command.data.name}: ${(deferErr as Error).message}`,
				);
				return;
			}
		}

		if (command.restrictive && isRestrictiveModeEnabled()) {
			const allowed = await checkAccess(interaction);
			if (!allowed) return;
		}

		try {
			await command.execute(interaction, client);
		} catch (err) {
			logger.error(
				`Error executing /${command.data.name}: ${(err as Error).stack ?? err}`,
			);

			const payload = {
				components: [
					errorContainer("Something went wrong running that command."),
				],
				flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
			};

			try {
				if (interaction.deferred || interaction.replied) {
					await interaction.editReply(payload);
				} else {
					await interaction.reply(payload);
				}
			} catch (replyErr) {
				logger.error(
					`Failed to send error response for /${command.data.name}: ${(replyErr as Error).message}`,
				);
			}
		}
	},
};

export default event;
