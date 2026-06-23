import {
	ApplicationIntegrationType,
	AttachmentBuilder,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import encodeQR from "qr";
import type { Command } from "../../types/index.js";
import { errorContainer } from "../../utils/components.js";
import { logger } from "../../utils/logger.js";

async function buildQrAttachment(url: string) {
	if (!url.startsWith("http")) throw new Error("Invalid URL");

	const gifBytes = encodeQR(url, "gif", { scale: 8 });

	return new AttachmentBuilder(Buffer.from(gifBytes), {
		name: "qr.gif",
	});
}
function isValidUrl(url: string) {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("gen-qr")
		.setDescription("Generate a QR code for a URL.")
		.addStringOption((opt) =>
			opt
				.setName("url")
				.setDescription("URL to generate a QR code for")
				.setRequired(true),
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
		const url = interaction.options.getString("url", true);
		if (!isValidUrl(url)) {
			await interaction.editReply({
				components: [
					errorContainer(
						"Invalid URL — make sure it starts with `http://` or `https://`.",
					),
				],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}
		let attachment: AttachmentBuilder;
		try {
			attachment = await buildQrAttachment(url);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			logger.error(message);
			await interaction.editReply({
				components: [
					errorContainer(
						"Something went wrong while generating the QR code.",
					),
				],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}
		await interaction.editReply({
			content: "Here's your QR code!",
			files: [attachment],
		});
	},
};

export default command;
