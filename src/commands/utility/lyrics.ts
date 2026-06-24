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
import {
	baseContainer,
	errorContainer,
	Separator,
	TextDisplay,
} from "../../utils/components.js";
import {
	formatSeconds,
	LyricsFetcher,
	type LyricsSource,
	parseDurationToSeconds,
	type ScoredCandidate,
	syncedToPlain,
} from "../../utils/lyrics.js";

const COLLECTOR_TIMEOUT_MS = 5 * 60 * 1000;
const LINES_PER_PAGE = 12;
const SATISFACTORY_SCORE = 75;
const SOURCE_ORDER: LyricsSource[] = [
	"lrclib",
	"musixmatch",
	"deezer",
	"genius",
];

interface LyricsMeta {
	title: string;
	artist: string;
	source: string;
}

function paginateLyrics(text: string): string[] {
	const lines = text
		.split("\n")
		.filter((l, i, arr) => l.trim() !== "" || (i > 0 && i < arr.length - 1));
	const pages: string[] = [];

	for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
		pages.push(lines.slice(i, i + LINES_PER_PAGE).join("\n"));
	}
	return pages.length ? pages : ["*No lyrics text returned.*"];
}

function buildLyricsContainer(
	pages: string[],
	index: number,
	meta: LyricsMeta,
) {
	return baseContainer()
		.addTextDisplayComponents(
			TextDisplay(`**${meta.title} — ${meta.artist}**`),
		)
		.addSeparatorComponents(Separator())
		.addTextDisplayComponents(TextDisplay(`>>> ${pages[index]}`))
		.addTextDisplayComponents(TextDisplay(`-# Source: ${meta.source}`));
}

function buildPageButtons(index: number, total: number, disableAll = false) {
	const prev = new ButtonBuilder()
		.setCustomId("lyrics_prev")
		.setLabel("prev")
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(disableAll || index === 0);

	const page = new ButtonBuilder()
		.setCustomId("lyrics_page")
		.setLabel(`${index + 1}/${total}`)
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(true);

	const next = new ButtonBuilder()
		.setCustomId("lyrics_next")
		.setLabel("next")
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(disableAll || index === total - 1);

	return new ActionRowBuilder<ButtonBuilder>().addComponents(prev, page, next);
}

function truncateLabel(text: string, max = 75): string {
	return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function buildPickerRows(
	candidates: ScoredCandidate[],
	targetSeconds: number | null,
	disableAll = false,
) {
	const pickRows = candidates.slice(0, 4).map((c, i) => {
		const dur = c.duration !== null ? formatSeconds(c.duration) : "?:??";
		const scoreText =
			targetSeconds !== null ? ` ${Math.round(c.score)}%` : "";
		const label = `${i + 1}. ${c.trackName} — ${c.artistName} [${dur}]${scoreText}`;

		return new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId(`lyrics_pick_${i}`)
				.setLabel(truncateLabel(label, 80))
				.setStyle(ButtonStyle.Primary)
				.setDisabled(disableAll),
		);
	});

	const otherRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId("lyrics_other_sources")
			.setLabel("Search other sources")
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(disableAll),
	);

	return [...pickRows, otherRow];
}

const command: Command = {
	data: new SlashCommandBuilder()
		.setName("lyrics")
		.setDescription("Fetch lyrics for a song.")
		.addStringOption((opt) =>
			opt.setName("song").setDescription("Song name").setRequired(true),
		)
		.addStringOption((opt) =>
			opt.setName("artist").setDescription("Artist name").setRequired(false),
		)
		.addStringOption((opt) =>
			opt
				.setName("duration")
				.setDescription(
					"Track duration as mm:ss, used to auto-match the right version",
				)
				.setRequired(false),
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
		const song = interaction.options.getString("song", true);
		const artist = interaction.options.getString("artist") ?? "";
		const durationRaw = interaction.options.getString("duration");

		let targetSeconds: number | null = null;
		if (durationRaw) {
			targetSeconds = parseDurationToSeconds(durationRaw);
			if (targetSeconds === null) {
				await interaction.editReply({
					components: [
						errorContainer(
							"Invalid duration format — use `mm:ss`, e.g. `3:42`.",
						),
					],
					flags: MessageFlags.IsComponentsV2,
				});
				return;
			}
		}

		const fetcher = new LyricsFetcher();

		try {
			const candidates = await fetcher.searchLrclib(
				song,
				artist || undefined,
			);

			if (!candidates.length) {
				await runOtherSourcesFlow(["lrclib"]);
				return;
			}

			const scored = fetcher.scoreCandidates(candidates, targetSeconds);
			const best = scored[0];

			const autoAccept =
				targetSeconds !== null
					? best.score >= SATISFACTORY_SCORE
					: candidates.length === 1;

			if (autoAccept) {
				await showLyricsFromCandidate(best);
				return;
			}

			await showPicker(scored);
		} catch {
			await interaction.editReply({
				components: [
					errorContainer(
						"Something went wrong fetching lyrics. Try again shortly.",
					),
				],
				flags: MessageFlags.IsComponentsV2,
			});
		}

		async function showLyricsFromCandidate(c: ScoredCandidate) {
			const plain = c.syncedLyrics
				? syncedToPlain(c.syncedLyrics)
				: c.plainLyrics;
			if (!plain) {
				await runOtherSourcesFlow(["lrclib"]);
				return;
			}
			await runPaginatedView(plain, {
				title: c.trackName,
				artist: c.artistName,
				source: "lrclib",
				synced: Boolean(c.syncedLyrics),
			});
		}

		async function showPicker(scored: ScoredCandidate[]) {
			const intro =
				targetSeconds !== null
					? `No confident duration match for "${song}" (target \`${formatSeconds(targetSeconds)}\`). Pick one:`
					: `Multiple results for "${song}". Pick one:`;

			const response = await interaction.editReply({
				content: intro,
				embeds: [],
				components: buildPickerRows(scored, targetSeconds),
			});

			const collector = response.createMessageComponentCollector({
				componentType: ComponentType.Button,
				filter: (i) => i.user.id === interaction.user.id,
				time: COLLECTOR_TIMEOUT_MS,
			});

			collector.on("collect", async (i) => {
				if (i.customId === "lyrics_other_sources") {
					collector.stop("other_sources");
					await i.deferUpdate();
					await runOtherSourcesFlow(["lrclib"]);
					return;
				}

				const match = /^lyrics_pick_(\d)$/.exec(i.customId);
				if (match) {
					collector.stop("picked");
					await i.deferUpdate();
					const idx = Number(match[1]);
					await showLyricsFromCandidate(scored[idx]);
				}
			});

			collector.on("end", async (_collected, reason) => {
				if (reason === "picked" || reason === "other_sources") return;
				try {
					await interaction.editReply({
						components: buildPickerRows(scored, targetSeconds, true),
					});
				} catch {
					/* message may be gone */
				}
			});
		}

		async function runOtherSourcesFlow(tried: LyricsSource[]) {
			const effectiveArtist = artist || song;
			const result = await fetcher.getLyricsSkipping(
				effectiveArtist,
				song,
				tried,
			);

			if (!result?.plain && !result?.synced) {
				const remaining = SOURCE_ORDER.filter((s) => !tried.includes(s));
				await interaction.editReply({
					components: [
						errorContainer(
							remaining.length
								? `No lyrics found from remaining sources (${remaining.join(", ")}).`
								: "No lyrics found from any source.",
						),
					],
					flags: MessageFlags.IsComponentsV2,
				});
				return;
			}

			const plain = result.synced
				? syncedToPlain(result.synced)
				: result.plain;
			const nextTried = [...tried, result.source];
			const sourcesLeft = SOURCE_ORDER.filter((s) => !nextTried.includes(s));

			await runPaginatedView(
				plain ?? "*No lyrics text returned.*",
				{
					title: song,
					artist: artist || "Unknown",
					source: result.source,
					synced: Boolean(result.synced),
				},
				sourcesLeft.length ? nextTried : undefined,
			);
		}

		async function runPaginatedView(
			text: string,
			meta: {
				title: string;
				artist: string;
				source: string;
				synced: boolean;
			},
			triedForMoreSources?: LyricsSource[],
		) {
			const pages = paginateLyrics(text);
			let index = 0;

			const tryNextSourceRow = triedForMoreSources
				? new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId("lyrics_try_next_source")
							.setLabel("Try next source")
							.setStyle(ButtonStyle.Secondary),
					)
				: null;

			function buildComponents(currentIndex: number, disableAll = false) {
				const container = buildLyricsContainer(pages, currentIndex, meta);

				if (pages.length > 1) {
					container.addActionRowComponents(
						buildPageButtons(currentIndex, pages.length, disableAll),
					);
				}

				if (tryNextSourceRow) {
					container.addActionRowComponents(tryNextSourceRow);
				}

				return [container];
			}

			const response = await interaction.editReply({
				content: "",
				embeds: [],
				components: buildComponents(index),
				flags: MessageFlags.IsComponentsV2,
			});

			if (pages.length === 1 && !triedForMoreSources) return;

			const collector = response.createMessageComponentCollector({
				componentType: ComponentType.Button,
				filter: (i) => i.user.id === interaction.user.id,
				time: COLLECTOR_TIMEOUT_MS,
			});

			collector.on("collect", async (i) => {
				if (
					i.customId === "lyrics_try_next_source" &&
					triedForMoreSources
				) {
					collector.stop("next_source");
					await i.deferUpdate();
					await runOtherSourcesFlow(triedForMoreSources);
					return;
				}

				if (i.customId === "lyrics_prev") index = Math.max(0, index - 1);
				else if (i.customId === "lyrics_next")
					index = Math.min(pages.length - 1, index + 1);
				else return;

				await i.update({
					content: "",
					embeds: [],
					components: buildComponents(index),
					flags: MessageFlags.IsComponentsV2,
				});
			});

			collector.on("end", async (_collected, reason) => {
				if (reason === "next_source") return;
				try {
					await interaction.editReply({
						components: buildComponents(index, true),
						flags: MessageFlags.IsComponentsV2,
					});
				} catch {
					/* message may be gone */
				}
			});
		}
	},
};

export default command;
