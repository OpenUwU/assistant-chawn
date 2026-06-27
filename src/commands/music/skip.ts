/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/index.js";
import { errorContainer } from "../../utils/components.js";

const command: Command = {
	sameVoiceRequired: true,
	voiceRequired: true,
	queueRequired: true,
	ActiveQueueRequired: true,
	data: new SlashCommandBuilder()
		.setName("skip")
		.setDescription("Skip the current song or jump to a position in queue.")
		.addIntegerOption((option) =>
			option
				.setName("position")
				.setDescription("Position in queue to jump to.")
				.setMinValue(1),
		),
	execute: async (interaction, { queue }) => {
		const currentQueue = queue;
		if (!currentQueue) {
			await interaction.editReply({
				components: [errorContainer("There is no active queue.")],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}
		const position = interaction.options.getInteger("position");

		if (position !== null) {
			if (position >= currentQueue.length) {
				await interaction.editReply({
					components: [
						errorContainer(
							`There is no song at position \`${position}\` in the queue.`,
						),
					],
					flags: MessageFlags.IsComponentsV2,
				});
				return;
			}

			const jumped = await currentQueue.jump(position);
			await interaction.editReply({
				content: `Jumped to **${jumped.title}** at position \`${position}\`.`,
			});
			return;
		}

		if (!currentQueue.hasNext && !currentQueue.autoplay) {
			await interaction.editReply({
				components: [
					errorContainer("There are no more songs in the queue."),
				],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		if (!currentQueue.hasNext && currentQueue.autoplay) {
			await currentQueue.seek(currentQueue.duration);
			await interaction.editReply({
				content: "Skipped. Loading next song via autoplay...",
			});
			return;
		}

		const nextTrack = await currentQueue.next();
		await interaction.editReply({
			content: `Skipped. Now playing **${nextTrack?.title}**.`,
		});
	},
};

export default command;
