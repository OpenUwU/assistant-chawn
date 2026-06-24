import {
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import decodeQR from "qr/decode.js";
import sharp from "sharp";
import type { Command } from "../../types/index.js";
import { errorContainer } from "../../utils/components.js";

async function scanQrFromBuffer(buffer: Buffer) {
	const { data, info } = await sharp(buffer)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });

	try {
		return decodeQR({
			width: info.width,
			height: info.height,
			data,
		});
	} catch {
		return null;
	}
}
function trimText(text: string, max: number) {
	return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("scan-qr")
		.setDescription("Scan a QR code from an image.")
		.addAttachmentOption((opt) =>
			opt
				.setName("image")
				.setDescription("Image to scan a QR code from")
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
		const attachment = interaction.options.getAttachment("image", true);

		if (!attachment.contentType?.startsWith("image/")) {
			await interaction.editReply({
				components: [
					errorContainer("You must provide a valid image attachment."),
				],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		const res = await fetch(attachment.url);
		const buffer = Buffer.from(await res.arrayBuffer());

		const result = await scanQrFromBuffer(buffer);
		if (!result) {
			await interaction.editReply({
				components: [
					errorContainer("Could not find a QR code in the image."),
				],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		await interaction.editReply({ content: `${trimText(result, 2048)}` });
	},
};

export default command;
