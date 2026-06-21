import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	InteractionContextType,
	SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../../types/index.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
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

const DESCRIPTION_LIMIT = 4000;
const FIELD_LIMIT = 1024;
const COLLECTOR_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Urban Dictionary wraps cross-linked terms in square brackets
 * strips the brackets  and normalizes line endings.
 */
function cleanUdText(text: string): string {
	return text
		.replace(/\[([^\]]+)\]/g, "$1")
		.replace(/\r\n/g, "\n")
		.trim();
}

function truncate(text: string, max: number): string {
	return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function buildEmbed(entry: UrbanDictionaryEntry, index: number, total: number) {
	const definition = truncate(
		cleanUdText(entry.definition),
		DESCRIPTION_LIMIT,
	);
	const example = cleanUdText(entry.example);

	const writtenTs = Math.floor(new Date(entry.written_on).getTime() / 1000);

	const embed = baseEmbed()
		.setTitle(entry.word)
		.setURL(entry.permalink)
		.setDescription(definition)
		.addFields(
			{ name: "Written", value: `<t:${writtenTs}:F>`, inline: true },
			{ name: "Author", value: entry.author || "Unknown", inline: true },
		);

	if (example) {
		embed.addFields({
			name: "Example",
			value: truncate(example, FIELD_LIMIT),
		});
	}

	embed.setFooter({ text: `Definition ${index + 1} of ${total}` });

	return embed;
}

function buildButtons(
	index: number,
	total: number,
	permalink: string,
	disableAll = false,
) {
	const prev = new ButtonBuilder()
		.setCustomId("ud_prev")
		.setLabel("prev")
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(disableAll || index === 0);

	const page = new ButtonBuilder()
		.setCustomId("ud_page")
		.setLabel(`${index + 1}/${total}`)
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(true);

	const next = new ButtonBuilder()
		.setCustomId("ud_next")
		.setLabel("next")
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(disableAll || index === total - 1);

	const link = new ButtonBuilder()
		.setLabel("Link")
		.setStyle(ButtonStyle.Link)
		.setURL(permalink);

	return new ActionRowBuilder<ButtonBuilder>().addComponents(
		prev,
		page,
		next,
		link,
	);
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
					embeds: [
						errorEmbed(`No Urban Dictionary results for **${term}**.`),
					],
				});
				return;
			}

			const entries = data.list;
			const total = entries.length;
			let index = 0;

			const response = await interaction.editReply({
				embeds: [buildEmbed(entries[index], index, total)],
				components: [
					buildButtons(
						index,
						total,
						entries[index].permalink,
						total === 1,
					),
				],
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
					embeds: [buildEmbed(entries[index], index, total)],
					components: [
						buildButtons(index, total, entries[index].permalink),
					],
				});
			});

			collector.on("end", async () => {
				try {
					await interaction.editReply({
						embeds: [buildEmbed(entries[index], index, total)],
						components: [
							buildButtons(index, total, entries[index].permalink, true),
						],
					});
				} catch {
					// message may have been deleted; ignore
				}
			});
		} catch {
			await interaction.editReply({
				embeds: [
					errorEmbed(
						"Something went wrong fetching that definition. Try again shortly.",
					),
				],
			});
		}
	},
};

export default command;
