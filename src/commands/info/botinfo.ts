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
import type { Command } from "../../types/index.js";
import {
	baseContainer,
	baseSection,
	Separator,
	TextDisplay,
	Thumbnail,
} from "../../utils/components.js";

function formatUptime(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("botinfo")
		.setDescription("Show information about the bot.")
		.setIntegrationTypes(
			ApplicationIntegrationType.UserInstall,
			ApplicationIntegrationType.GuildInstall,
		)
		.setContexts(
			InteractionContextType.Guild,
			InteractionContextType.BotDM,
			InteractionContextType.PrivateChannel,
		),

	execute: async (interaction, client) => {
		const uptime = client.uptime ? formatUptime(client.uptime) : "unknown";
		const memoryMb = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);

		await interaction.editReply({
			components: [
				baseContainer()
					.addTextDisplayComponents(TextDisplay("### Bot Info"))
					.addSeparatorComponents(Separator())
					.addSectionComponents(
						baseSection()
							.addTextDisplayComponents(
								TextDisplay("What is this?"),
								TextDisplay(
									">>> Assistant Chawn is a discord user installable app with some niche utility commands and features.",
								),
							)
							.setThumbnailAccessory(
								Thumbnail(
									"Thumbnail",
									client.user?.displayAvatarURL() ||
										"https://i.ibb.co/tpCGpJMs/c352f0bbe49e7326e92872669b5e9447.png",
								),
							),
					)
					.addSeparatorComponents(Separator())
					.addTextDisplayComponents(
						TextDisplay(
							`- Commands: ${client.commands.size}\n` +
								`- Uptime: ${uptime}\n` +
								`- Memory: ${memoryMb} MB\n` +
								`- Websocket: ${client.ws.ping}ms\n` +
								`- Node: ${process.version}`,
						),
						TextDisplay("-# Assistant Chawn — by The OpenUwU Project"),
					),
			],
			flags: MessageFlags.IsComponentsV2,
		});
	},
};

export default command;
