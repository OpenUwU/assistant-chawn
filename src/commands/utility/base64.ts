/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../../types/index.js";
import { errorContainer } from "../../utils/components.js";

const CODEBLOCK_OVERHEAD = "```text\n\n```".length;
const PAGE_LIMIT = 2000 - CODEBLOCK_OVERHEAD;
const COLLECTOR_TIMEOUT_MS = 5 * 60 * 1000;

function base64Encode(text: string): string {
	return Buffer.from(text, "utf8").toString("base64");
}

function base64Decode(text: string): string {
	return Buffer.from(text, "base64").toString("utf8");
}

function isValidBase64(text: string): boolean {
	const stripped = text.replace(/\s+/g, "");
	if (stripped.length === 0 || stripped.length % 4 !== 0) return false;
	if (!/^[A-Za-z0-9+/]+={0,2}$/.test(stripped)) return false;
	return base64Encode(base64Decode(stripped)) === stripped;
}

function paginate(text: string, max: number): string[] {
	if (text.length === 0) return [""];
	const pages: string[] = [];
	for (let i = 0; i < text.length; i += max) {
		pages.push(text.slice(i, i + max));
	}
	return pages;
}

function escapeCodeblock(text: string): string {
	return text.replace(/```/g, "`\u200b``");
}

function buildContent(pages: string[], index: number): string {
	return `\`\`\`text\n${escapeCodeblock(pages[index])}\n\`\`\``;
}

function buildRow(pages: string[], index: number, disableAll = false) {
	const total = pages.length;
	const prev = new ButtonBuilder()
		.setCustomId("b64_prev")
		.setLabel("prev")
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(disableAll || index === 0);

	const page = new ButtonBuilder()
		.setCustomId("b64_page")
		.setLabel(`${index + 1}/${total}`)
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(true);

	const next = new ButtonBuilder()
		.setCustomId("b64_next")
		.setLabel("next")
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(disableAll || index === total - 1);

	return new ActionRowBuilder<ButtonBuilder>().addComponents(prev, page, next);
}

async function replyPaginated(
	interaction: Parameters<Command["execute"]>[0],
	result: string,
) {
	const pages = paginate(result, PAGE_LIMIT);
	const total = pages.length;
	let index = 0;

	const response = await interaction.editReply({
		content: buildContent(pages, index),
		components: total > 1 ? [buildRow(pages, index)] : [],
	});

	if (total === 1) return;

	const collector = response.createMessageComponentCollector({
		componentType: ComponentType.Button,
		filter: (i) => i.user.id === interaction.user.id,
		time: COLLECTOR_TIMEOUT_MS,
	});

	collector.on("collect", async (i) => {
		if (i.customId === "b64_prev") {
			index = Math.max(0, index - 1);
		} else if (i.customId === "b64_next") {
			index = Math.min(total - 1, index + 1);
		}

		await i.update({
			content: buildContent(pages, index),
			components: [buildRow(pages, index)],
		});
	});

	collector.on("end", async () => {
		try {
			await interaction.editReply({
				content: buildContent(pages, index),
				components: [buildRow(pages, index, true)],
			});
		} catch {
			// message may have been deleted; ignore
		}
	});
}

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("base64")
		.setDescription("Encode or decode text using base64.")
		.addSubcommand((sub) =>
			sub
				.setName("encode")
				.setDescription("Encode text to base64.")
				.addStringOption((opt) =>
					opt
						.setName("text")
						.setDescription("The text to encode")
						.setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName("decode")
				.setDescription("Decode base64 text.")
				.addStringOption((opt) =>
					opt
						.setName("text")
						.setDescription("The base64 text to decode")
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
		const text = interaction.options.getString("text", true);

		try {
			if (subcommand === "encode") {
				const encoded = base64Encode(text);
				await replyPaginated(interaction, encoded);
				return;
			}

			if (subcommand === "decode") {
				if (!isValidBase64(text)) {
					await interaction.editReply({
						components: [
							errorContainer("That doesn't look like valid base64."),
						],
						flags: MessageFlags.IsComponentsV2,
					});
					return;
				}

				const decoded = base64Decode(text.replace(/\s+/g, ""));
				await replyPaginated(interaction, decoded);
				return;
			}
		} catch {
			await interaction.editReply({
				components: [
					errorContainer(
						"Something went wrong processing that text. Try again shortly.",
					),
				],
				flags: MessageFlags.IsComponentsV2,
			});
		}
	},
};

export default command;
