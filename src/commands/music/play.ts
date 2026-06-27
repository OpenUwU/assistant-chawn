/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import {
	ChannelType,
	type ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
	type VoiceBasedChannel,
} from "discord.js";
import { player } from "../../index.js";
import type { Command } from "../../types/index.js";
import { errorContainer } from "../../utils/components.js";
import {
	canBotConnect,
	canBotSpeak,
	unsuppressIfNeeded,
} from "../../utils/voice.js";

async function handleStage(
	interaction: ChatInputCommandInteraction,
	userVoice: VoiceBasedChannel,
) {
	const isUnsuppressed = await unsuppressIfNeeded(userVoice);
	if (!isUnsuppressed) {
		await interaction.editReply({
			components: [
				errorContainer(
					'I cannot speak in your voice channel, make sure I got the "Speak" permission in your voice channel. Or "Mute Members" permission if the channel is a stage channel.',
				),
			],
			flags: MessageFlags.IsComponentsV2,
		});
		return false;
	}
	return true;
}

const command: Command = {
	voiceRequired: true,
	sameVoiceRequired: true,
	data: new SlashCommandBuilder()
		.setName("play")
		.setDescription("Play a song.")
		.addStringOption((option) =>
			option
				.setName("query")
				.setDescription("The song to play.")
				.setRequired(true),
		),
	execute: async (interaction, { userVoice }) => {
		if (!interaction.channel || !interaction.guild) {
			await interaction.editReply({
				components: [
					errorContainer("This command can only be used in a Server."),
				],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		if (!userVoice) {
			await interaction.editReply({
				components: [
					errorContainer(
						"You must be in a voice channel to use this command.",
					),
				],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		if (!canBotConnect(userVoice)) {
			await interaction.editReply({
				components: [
					errorContainer(
						'I cannot connect to your voice channel, make sure I got the "Connect" permission in your voice channel.',
					),
				],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		if (!canBotSpeak(userVoice)) {
			await interaction.editReply({
				components: [
					errorContainer(
						'I cannot speak in your voice channel, make sure I got the "Speak" permission in your voice channel. Or "Mute Members" permission if the channel is a stage channel.',
					),
				],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		const query = interaction.options.getString("query", true);
		const existingQueue = player.queues.get(interaction.guild.id);

		const [searchResult, currentQueue] = await Promise.all([
			player.search(query, { prefix: "spsearch" }),
			existingQueue ??
				player.queues.create({
					guildId: interaction.guild.id,
					voiceId: userVoice.id,
					context: { textId: interaction.channel.id },
					volume: 80,
				}),
		]);

		if (userVoice.type === ChannelType.GuildStageVoice) {
			const isReady = await handleStage(interaction, userVoice);

			if (!isReady) return;
		}

		const isActive =
			currentQueue.playing || currentQueue.paused || currentQueue.stopped;

		switch (searchResult.type) {
			case "track": {
				const track = searchResult.data;
				if (isActive) {
					currentQueue.add(track);
				} else {
					await player.play(track, {
						voiceId: userVoice.id,
						guildId: currentQueue.guildId,
					});
				}
				await interaction.editReply({
					content: `Added **${track.title}** [\`${track.formattedDuration}\`] - ${track.author} to the queue.\n-# ${Math.max(0, currentQueue.length - 1)} songs up next`,
				});
				break;
			}
			case "query": {
				const track = searchResult.data[0];
				if (isActive) {
					currentQueue.add(track);
				} else {
					await player.play(track, {
						voiceId: userVoice.id,
						guildId: currentQueue.guildId,
					});
				}
				await interaction.editReply({
					content: `Added **${track.title}** [\`${track.formattedDuration}\`] - ${track.author} to the queue.\n-# ${Math.max(0, currentQueue.length - 1)} songs up next`,
				});
				break;
			}
			case "playlist": {
				const playlist = searchResult.data;
				if (isActive) {
					currentQueue.add(playlist);
				} else {
					await player.play(playlist, {
						voiceId: userVoice.id,
						guildId: currentQueue.guildId,
					});
				}
				await interaction.editReply({
					content: `Added \`${playlist.tracks.length}\` tracks from **${playlist.name}** [\`${playlist.formattedDuration}\`] to the queue.\n-# ${Math.max(0, currentQueue.length - 1)} songs up next`,
				});
				break;
			}
			case "error": {
				await interaction.editReply({
					components: [
						errorContainer(
							searchResult.data.message ??
								"Something went wrong, please try again later.",
						),
					],
					flags: MessageFlags.IsComponentsV2,
				});
				break;
			}
			case "empty": {
				await interaction.editReply({
					components: [errorContainer("No results found.")],
					flags: MessageFlags.IsComponentsV2,
				});
				break;
			}
		}
	},
};

export default command;
