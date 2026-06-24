/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import { linguist, type SourcebinLinguistItem } from "@sourcebin/linguist";
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../../types/index.js";
import { errorContainer } from "../../utils/components.js";

const API_URL = "https://sourceb.in/api";

interface SourcebinFileData {
	name?: string;
	content?: string;
	languageId: number;
}

interface SourcebinPostBody {
	title?: string;
	description?: string;
	files: SourcebinFileData[];
}

interface SourcebinPostResponse {
	key: string;
}

function resolveLanguageId(language: string): number {
	const normalized = language.toLowerCase();

	for (const [id, data] of Object.entries(
		linguist as Record<string, SourcebinLinguistItem>,
	)) {
		const matches =
			data.name.toLowerCase() === normalized ||
			data.aliases?.map((a) => a.toLowerCase()).includes(normalized);

		if (matches) return Number(id);
	}

	throw new Error(`Unable to find language "${language}"`);
}

function buildSourcebinUrls(key: string) {
	return {
		key,
		url: `https://sourceb.in/${key}`,
		shortUrl: `https://srcb.in/${key}`,
	};
}
async function createSourcebin(
	content: string,
	language: string,
	title?: string,
): Promise<{ key: string; url: string; shortUrl: string }> {
	const languageId = resolveLanguageId(language);

	const body: SourcebinPostBody = {
		title,
		files: [{ content, languageId }],
	};

	const res = await fetch(`${API_URL}/bins`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const errBody = (await res.json().catch(() => null)) as {
			message?: string;
		} | null;
		throw new Error(errBody?.message ?? "Failed to create paste.");
	}

	const data = (await res.json()) as SourcebinPostResponse;
	return buildSourcebinUrls(data.key);
}

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("paste")
		.setDescription("paste related commands")
		.addSubcommand((sub) =>
			sub
				.setName("rs")
				.setDescription("create a quick plaintext paste (paste.rs)")
				.addStringOption((opt) =>
					opt
						.setName("text")
						.setDescription("the text to paste")
						.setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName("sourcebin")
				.setDescription(
					"create a paste with syntax highlighting (sourceb.in)",
				)
				.addStringOption((opt) =>
					opt
						.setName("text")
						.setDescription("the text to paste")
						.setRequired(true),
				)
				.addStringOption((opt) =>
					opt.setName("title").setDescription("optional title"),
				)
				.addStringOption((opt) =>
					opt
						.setName("language")
						.setDescription("syntax highlighting language")
						.addChoices(
							{ name: "Plain Text", value: "text" },
							{ name: "JavaScript", value: "javascript" },
							{ name: "TypeScript", value: "typescript" },
							{ name: "Python", value: "python" },
							{ name: "JSON", value: "json" },
							{ name: "Bash", value: "bash" },
							{ name: "YAML", value: "yaml" },
							{ name: "SQL", value: "sql" },
							{ name: "HTML", value: "html" },
							{ name: "CSS", value: "css" },
						),
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

		if (text.length > 25000) {
			await interaction.editReply({
				components: [
					errorContainer("Text is too long (max 25,000 characters)."),
				],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		if (subcommand === "rs") {
			try {
				const res = await fetch("https://paste.rs/", {
					method: "POST",
					body: text,
				});

				if (!res.ok) {
					await interaction.editReply({
						components: [errorContainer("Failed to create paste.")],
						flags: MessageFlags.IsComponentsV2,
					});
					return;
				}

				const url = (await res.text()).trim();

				await interaction.editReply({
					components: [
						new ActionRowBuilder<ButtonBuilder>().addComponents(
							new ButtonBuilder()
								.setStyle(ButtonStyle.Link)
								.setLabel("paste.rs")
								.setURL(url),
						),
					],
				});
			} catch {
				await interaction.editReply({
					components: [errorContainer("Failed to create paste.")],
					flags: MessageFlags.IsComponentsV2,
				});
			}
			return;
		}

		if (subcommand === "sourcebin") {
			const title = interaction.options.getString("title") ?? undefined;
			const language = interaction.options.getString("language") ?? "text";

			try {
				const bin = await createSourcebin(text, language, title);
				await interaction.editReply({
					components: [
						new ActionRowBuilder<ButtonBuilder>().addComponents(
							new ButtonBuilder()
								.setStyle(ButtonStyle.Link)
								.setLabel("sourceb.in")
								.setURL(bin.url),
						),
					],
				});
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Failed to create paste.";
				await interaction.editReply({
					components: [errorContainer(message)],
					flags: MessageFlags.IsComponentsV2,
				});
			}
			return;
		}

		await interaction.editReply({
			components: [errorContainer("Unknown subcommand.")],
			flags: MessageFlags.IsComponentsV2,
		});
	},
};

export default command;
