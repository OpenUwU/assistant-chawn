/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import type { Queue } from "discolink";
import type {
	ChatInputCommandInteraction,
	VoiceBasedChannel,
} from "discord.js";
import { Events, type Interaction, MessageFlags } from "discord.js";
import type { ExtendedClient } from "../client.js";
import { player } from "../index.js";
import type { BotEvent } from "../types/index.js";
import {
	checkAccess,
	isOwner,
	isRestrictiveModeEnabled,
} from "../utils/access.js";
import { errorContainer } from "../utils/components.js";
import { applyCooldown, getRemainingCooldown } from "../utils/cooldown.js";
import { logger } from "../utils/logger.js";
import {
	getBotVoiceChannel,
	getMemberVoiceChannel,
	isSameVoice,
} from "../utils/voice.js";

async function respondError(
	interaction: ChatInputCommandInteraction,
	message: string,
): Promise<void> {
	const payload = {
		components: [errorContainer(message)],
		flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
	};
	try {
		if (interaction.deferred || interaction.replied) {
			await interaction.editReply(payload);
		} else {
			await interaction.reply(payload);
		}
	} catch (err) {
		logger.error(
			`Failed to send error response for /${interaction.commandName}: ${(err as Error).message}`,
		);
	}
}

const event: BotEvent<typeof Events.InteractionCreate> = {
	name: Events.InteractionCreate,
	execute: async (interaction: Interaction) => {
		const client = interaction.client as ExtendedClient;

		if (interaction.isAutocomplete()) {
			const command = client.commands.get(interaction.commandName);
			if (!command?.autocomplete) return;
			try {
				await command.autocomplete(interaction);
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
			await respondError(interaction, "This command is owner-only.");
			return;
		}

		if (!owner) {
			const remaining = await getRemainingCooldown(interaction.user.id);
			if (remaining > 0) {
				await respondError(
					interaction,
					`Slow down — try again in ${(remaining / 1000).toFixed(1)}s.`,
				);
				return;
			}
			await applyCooldown(interaction.user.id);
		}

		if (!command.skipAutoDefer) {
			try {
				await interaction.deferReply();
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

		let userVoice: VoiceBasedChannel | null = null;
		let botVoice: VoiceBasedChannel | null = null;

		if (
			(command.voiceRequired || command.sameVoiceRequired) &&
			interaction.guild
		) {
			const member =
				interaction.member && "voice" in interaction.member
					? interaction.member
					: null;

			if (!member) {
				await respondError(
					interaction,
					"You must be in a voice channel to use this command.",
				);
				return;
			}
			userVoice = getMemberVoiceChannel(member);

			if (!userVoice) {
				await respondError(
					interaction,
					"You must be in a voice channel to use this command.",
				);
				return;
			}
			botVoice = getBotVoiceChannel(interaction.guild);

			if (botVoice && command.sameVoiceRequired && !isSameVoice(member)) {
				await respondError(
					interaction,
					"You must be in the same voice channel as me to use this command.",
				);
				return;
			}
		}
		let queue: Queue | null = null;
		if (
			(command.queueRequired || command.ActiveQueueRequired) &&
			interaction.guild?.id
		) {
			queue = player.getQueue(interaction.guild.id) ?? null;
			if (!queue) {
				await respondError(
					interaction,
					"No active player exists in this server and this command requires one.",
				);
				return;
			}
			const isPLaying = queue.playing || queue.paused;
			if (command.ActiveQueueRequired && !isPLaying) {
				await respondError(
					interaction,
					"The bot is not playing anything and this command requires the player to be active.",
				);
			}
		}

		try {
			await command.execute(interaction, { userVoice, botVoice, queue });
		} catch (err) {
			logger.error(
				`Error executing /${command.data.name}: ${(err as Error).stack ?? err}`,
			);
			await respondError(
				interaction,
				"Something went wrong running that command.",
			);
		}
	},
};

export default event;
