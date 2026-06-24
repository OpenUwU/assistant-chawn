import {
	ApplicationIntegrationType,
	AttachmentBuilder,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import encodeQR from "qr";
import decodeQR from "qr/decode.js";
import sharp from "sharp";
import type { Command } from "../../types/index.js";
import {
	baseContainer,
	errorContainer,
	Separator,
	TextDisplay,
} from "../../utils/components.js";
import { logger } from "../../utils/logger.js";

async function buildQrBuffer(text: string): Promise<Buffer> {
	const gifBytes = encodeQR(text, "gif", { scale: 8 });
	return Buffer.from(gifBytes);
}

async function scanQrFromBuffer(buffer: Buffer): Promise<string | null> {
	const { data, info } = await sharp(buffer)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	try {
		return decodeQR({ width: info.width, height: info.height, data });
	} catch {
		return null;
	}
}

function trimText(text: string, max: number): string {
	return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function isValidUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("qr")
		.setDescription("QR code tools.")
		.addSubcommand((sub) =>
			sub
				.setName("scan")
				.setDescription("Scan a QR code from an image.")
				.addAttachmentOption((o) =>
					o
						.setName("image")
						.setDescription("Image containing a QR code")
						.setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName("url")
				.setDescription("Generate a QR code for a URL.")
				.addStringOption((o) =>
					o
						.setName("url")
						.setDescription("URL to encode")
						.setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName("text")
				.setDescription("Generate a QR code for any text.")
				.addStringOption((o) =>
					o
						.setName("text")
						.setDescription("Text to encode (max 500 chars)")
						.setRequired(true)
						.setMaxLength(500),
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
		const sub = interaction.options.getSubcommand();

		if (sub === "scan") {
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

			await interaction.editReply({
				components: [
					baseContainer()
						.addTextDisplayComponents(TextDisplay("### QR Scan Result"))
						.addSeparatorComponents(Separator())
						.addTextDisplayComponents(
							TextDisplay(`\`\`\`\n${trimText(result, 1900)}\n\`\`\``),
						),
				],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		if (sub === "url") {
			const url = interaction.options.getString("url", true);

			if (!isValidUrl(url)) {
				await interaction.editReply({
					components: [
						errorContainer(
							"Invalid URL — must start with `http://` or `https://`.",
						),
					],
					flags: MessageFlags.IsComponentsV2,
				});
				return;
			}

			try {
				const buf = await buildQrBuffer(url);
				const attachment = new AttachmentBuilder(buf, { name: "qr.gif" });

				await interaction.editReply({
					files: [attachment],
				});
			} catch (err) {
				logger.error(`QR url error: ${err}`);
				await interaction.editReply({
					components: [errorContainer("Failed to generate QR code.")],
					flags: MessageFlags.IsComponentsV2,
				});
			}
			return;
		}

		if (sub === "text") {
			const text = interaction.options.getString("text", true);

			try {
				const buf = await buildQrBuffer(text);
				const attachment = new AttachmentBuilder(buf, { name: "qr.gif" });

				await interaction.editReply({
					files: [attachment],
				});
			} catch (err) {
				logger.error(`QR text error: ${err}`);
				await interaction.editReply({
					components: [errorContainer("Failed to generate QR code.")],
					flags: MessageFlags.IsComponentsV2,
				});
			}
		}
	},
};

export default command;
