/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import {
	ApplicationIntegrationType,
	ComponentType,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../../types/index.js";
import {
	ActionRow,
	baseContainer,
	errorContainer,
	linkButton,
	Separator,
	secondaryButton,
	TextDisplay,
} from "../../utils/components.js";
import { fetchJson } from "../../utils/http.js";

interface UrbanDictionaryEntry {
	word: string;
	definition: string;
	example: string;
	author: string;
	permalink: string;
	written_on: string;
}
interface UrbanDictionaryResponse {
	list: UrbanDictionaryEntry[];
}

const COLLECTOR_TIMEOUT_MS = 5 * 60 * 1000;

function cleanUdText(text: string): string {
	return text
		.replace(/\[([^\]]+)\]/g, "$1")
		.replace(/\r\n/g, "\n")
		.trim();
}

function truncate(text: string, max: number): string {
	return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function buildContainer(
	entry: UrbanDictionaryEntry,
	index: number,
	total: number,
) {
	const definition = truncate(cleanUdText(entry.definition), 2048);
	const example = truncate(cleanUdText(entry.example), 1536);

	const writtenTs = Math.floor(new Date(entry.written_on).getTime() / 1000);
	const container = baseContainer()
		.addTextDisplayComponents(TextDisplay(`**${truncate(entry.word, 256)}**`))
		.addSeparatorComponents(Separator())
		.addTextDisplayComponents(
			TextDisplay(`>>> ${definition}`),
			TextDisplay(`>>> ${truncate(entry.author, 50)} <t:${writtenTs}:F>`),
			TextDisplay("Example:"),
			TextDisplay(`>>> ${example ?? "No example."} `),
			TextDisplay(`-# definition ${index + 1} of ${total}`),
		);

	return container;
}

function buildButtons(
	index: number,
	total: number,
	permalink: string,
	disableAll = false,
) {
	const prev = secondaryButton("prev", "ud_prev", disableAll || index === 0);
	const page = secondaryButton(`${index + 1}/${total}`, "ud_page", true);
	const next = secondaryButton(
		"next",
		"ud_next",
		disableAll || index === total - 1,
	);
	const link = linkButton("link", permalink);
	return ActionRow().addComponents(prev, page, next, link);
}

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("dictionary")
		.setDescription("Look up a word on Urban Dictionary.")
		.addStringOption((opt) =>
			opt
				.setName("word")
				.setDescription("The word or phrase to define")
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
		const term = interaction.options.getString("word", true).trim();

		try {
			const data = await fetchJson<UrbanDictionaryResponse>(
				`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`,
			);

			if (data.list.length === 0) {
				await interaction.editReply({
					components: [
						errorContainer(
							`No Urban Dictionary results for **${term}**.`,
						),
					],
					flags: MessageFlags.IsComponentsV2,
				});
				return;
			}

			const entries = data.list;
			const total = entries.length;
			let index = 0;
			const response = await interaction.editReply({
				components: [
					buildContainer(
						entries[index],
						index,
						total,
					).addActionRowComponents(
						buildButtons(
							index,
							total,
							entries[index].permalink,
							total === 1,
						),
					),
				],
				flags: MessageFlags.IsComponentsV2,
			});
			if (total === 1) return;

			const collector = response.createMessageComponentCollector({
				componentType: ComponentType.Button,
				filter: (i) => i.user.id === interaction.user.id,
				time: COLLECTOR_TIMEOUT_MS,
			});

			collector.on("collect", async (i) => {
				if (i.customId === "ud_prev") {
					index = Math.max(0, index - 1);
				} else if (i.customId === "ud_next") {
					index = Math.min(total - 1, index + 1);
				}

				await i.update({
					components: [
						buildContainer(
							entries[index],
							index,
							total,
						).addActionRowComponents(
							buildButtons(index, total, entries[index].permalink),
						),
					],
					flags: MessageFlags.IsComponentsV2,
				});
			});

			collector.on("end", async () => {
				try {
					await interaction.editReply({
						components: [
							buildContainer(
								entries[index],
								index,
								total,
							).addActionRowComponents(
								buildButtons(
									index,
									total,
									entries[index].permalink,
									true,
								),
							),
						],
						flags: MessageFlags.IsComponentsV2,
					});
				} catch {
					// message may have been deleted; ignore
				}
			});
		} catch {
			await interaction.editReply({
				components: [
					errorContainer(
						"Something went wrong fetching that definition. Try again shortly.",
					),
				],
				flags: MessageFlags.IsComponentsV2,
			});
		}
	},
};

export default command;
