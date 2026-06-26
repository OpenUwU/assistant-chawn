/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

const REQUEST_TIMEOUT = 8000;

export type LyricsSource = "lrclib" | "musixmatch" | "deezer" | "genius";

export interface LyricsResult {
	synced: string | null;
	plain: string | null;
	source: LyricsSource;
}

export interface LrclibCandidate {
	id: number;
	trackName: string;
	artistName: string;
	albumName: string | null;
	duration: number | null; // seconds
	instrumental: boolean;
	plainLyrics: string | null;
	syncedLyrics: string | null;
}

export interface ScoredCandidate extends LrclibCandidate {
	score: number; // 0-100, 100 = perfect duration match (or no duration given)
}

interface MxmSubtitleLine {
	time?: { total?: number };
	text?: string;
}

interface DeezerWordLineWord {
	word: string;
}

interface DeezerWordLine {
	start: number;
	end: number;
	words: DeezerWordLineWord[];
}

interface DeezerSyncLine {
	milliseconds: number;
	duration: number;
	line: string;
}

interface DeezerLyrics {
	synchronizedWordByWordLines?: DeezerWordLine[];
	synchronizedLines?: DeezerSyncLine[];
	text?: string;
}

interface GeniusSection {
	type: string;
	hits?: Array<{ result?: { path?: string } }>;
}

export function syncedToPlain(synced: string | null): string | null {
	if (!synced) return null;
	return synced
		.split("\n")
		.map((l) => l.replace(/\[\d{1,2}:\d{2}\.\d{2,3}\]\s*/g, "").trim())
		.filter(Boolean)
		.join("\n");
}

function cleanText(text: string): string {
	const patterns = [
		/\s*\([^)]*(?:official|lyrics?|video|audio|mv|visualizer|color\s*coded|hd|4k|prod\.)[^)]*\)/gi,
		/\s*\[[^\]]*(?:official|lyrics?|video|audio|mv|visualizer|color\s*coded|hd|4k|prod\.)[^\]]*\]/gi,
		/\s*-\s*Topic$/i,
		/VEVO$/i,
	];
	return patterns.reduce((s, p) => s.replace(p, ""), text).trim();
}

function lrcTime(ms: number): string {
	const minutes = Math.floor(ms / 60000);
	const seconds = Math.floor((ms % 60000) / 1000);
	const currentSeconds = Math.floor((ms % 1000) / 10);
	return `[${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(currentSeconds).padStart(2, "0")}]`;
}

async function fetchJsonSafe<T>(
	url: string,
	opts: RequestInit = {},
): Promise<T | null> {
	try {
		const res = await fetch(url, {
			signal: AbortSignal.timeout(REQUEST_TIMEOUT),
			...opts,
		});
		if (!res.ok) return null;
		return (await res.json().catch(() => null)) as T | null;
	} catch {
		return null;
	}
}

/** Parse "mm:ss" or "m:ss" into seconds. Returns null if invalid. */
export function parseDurationToSeconds(input: string): number | null {
	const match = /^(\d{1,3}):([0-5]\d)$/.exec(input.trim());
	if (!match) return null;
	const minutes = parseInt(match[1], 10);
	const seconds = parseInt(match[2], 10);
	return minutes * 60 + seconds;
}

export function formatSeconds(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = Math.floor(totalSeconds % 60);
	return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export class LyricsFetcher {
	private guid: string;
	private mxmToken: string | null = null;
	private mxmTokenExp = 0;
	private deezerJwt: string | null = null;
	private deezerJwtExp = 0;

	constructor() {
		this.guid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
			/[xy]/g,
			(ch) => {
				const result = (Math.random() * 16) | 0;
				return (ch === "x" ? result : (result & 0x3) | 0x8).toString(16);
			},
		);
	}

	async searchLrclib(
		song: string,
		artist?: string,
	): Promise<LrclibCandidate[]> {
		const params = new URLSearchParams({ track_name: cleanText(song) });
		if (artist) params.set("artist_name", cleanText(artist));

		const data = await fetchJsonSafe<LrclibCandidate[]>(
			`https://lrclib.net/api/search?${params}`,
		);
		return data ?? [];
	}

	/** Score candidates against a target duration (seconds). 100 = exact match. */
	scoreCandidates(
		candidates: LrclibCandidate[],
		targetSeconds: number | null,
	): ScoredCandidate[] {
		return candidates
			.map((c) => {
				let score = 100;
				if (targetSeconds !== null && c.duration !== null) {
					const diff = Math.abs(c.duration - targetSeconds);
					score = Math.max(0, 100 - diff * 8); // -8 pts per second off
				} else if (targetSeconds !== null && c.duration === null) {
					score = 40;
				}
				return { ...c, score };
			})
			.sort((a, b) => b.score - a.score);
	}

	async getLrclib(artist: string, song: string): Promise<LyricsResult | null> {
		const data = await fetchJsonSafe<{
			syncedLyrics?: string;
			plainLyrics?: string;
		}>(
			`https://lrclib.net/api/get?${new URLSearchParams({
				track_name: cleanText(song),
				artist_name: cleanText(artist),
			})}`,
		);
		if (!data?.syncedLyrics && !data?.plainLyrics) return null;
		return {
			synced: data.syncedLyrics || null,
			plain:
				data.plainLyrics ||
				(data.syncedLyrics ? syncedToPlain(data.syncedLyrics) : null),
			source: "lrclib",
		};
	}

	private async getMxmToken(): Promise<string | null> {
		if (this.mxmToken && Date.now() < this.mxmTokenExp) return this.mxmToken;
		const data = await fetchJsonSafe<{
			message?: { body?: { user_token?: string } };
		}>(
			"https://apic-desktop.musixmatch.com/ws/1.1/token.get?app_id=web-desktop-app-v1.0",
			{ headers: { "user-agent": "Mozilla/5.0", accept: "*/*" } },
		);
		const token = data?.message?.body?.user_token;
		if (!token) return null;
		this.mxmToken = token;
		this.mxmTokenExp = Date.now() + 55_000;
		return token;
	}

	private async mxmReq(
		endpoint: string,
		params: Record<string, string>,
	): Promise<Record<string, unknown> | null> {
		const token = await this.getMxmToken();
		if (!token) return null;
		const qs = new URLSearchParams({
			...params,
			app_id: "web-desktop-app-v1.0",
			usertoken: token,
			guid: this.guid,
		});
		const data = await fetchJsonSafe<{
			message?: { body?: Record<string, unknown> };
		}>(`${endpoint}?${qs}`, {
			headers: { accept: "application/json", "user-agent": "Mozilla/5.0" },
		});
		return data?.message?.body ?? null;
	}

	async getMusixmatch(
		artist: string,
		song: string,
	): Promise<LyricsResult | null> {
		const searchBody = await this.mxmReq(
			"https://apic-desktop.musixmatch.com/ws/1.1/track.search",
			{
				q_artist: artist,
				q_track: song,
				page_size: "3",
				page: "1",
				s_track_rating: "desc",
			},
		);
		const trackList = searchBody?.track_list as
			| Array<{ track?: { track_id?: string } }>
			| undefined;
		const track = trackList?.[0]?.track;
		if (!track) return null;

		const id = track.track_id as string;
		const [subBody, lyrBody] = await Promise.all([
			this.mxmReq(
				"https://apic-desktop.musixmatch.com/ws/1.1/track.subtitle.get",
				{
					track_id: id,
					subtitle_format: "mxm",
				},
			),
			this.mxmReq(
				"https://apic-desktop.musixmatch.com/ws/1.1/track.lyrics.get",
				{ track_id: id },
			),
		]);

		const subtitle = subBody?.subtitle as
			| { subtitle_body?: string }
			| undefined;
		const rawSub = subtitle?.subtitle_body;
		if (rawSub) {
			try {
				const parsed = JSON.parse(rawSub) as MxmSubtitleLine[];
				if (Array.isArray(parsed) && parsed.length) {
					const synced = parsed
						.map(
							(item) =>
								`${lrcTime(Math.round((item?.time?.total || 0) * 1000))} ${item?.text || ""}`,
						)
						.join("\n");
					return {
						synced,
						plain: syncedToPlain(synced),
						source: "musixmatch",
					};
				}
			} catch {
				/* ignore */
			}
		}

		const lyrics = lyrBody?.lyrics as { lyrics_body?: string } | undefined;
		const plain = lyrics?.lyrics_body;
		if (plain) return { synced: null, plain, source: "musixmatch" };
		return null;
	}

	private async getDeezerJwt(): Promise<string | null> {
		if (this.deezerJwt && Date.now() < this.deezerJwtExp)
			return this.deezerJwt;
		const data = await fetchJsonSafe<{ jwt?: string }>(
			"https://auth.deezer.com/login/anonymous?jo=p&rto=c",
		);
		if (!data?.jwt) return null;
		this.deezerJwt = data.jwt;
		this.deezerJwtExp = Date.now() + 300_000;
		return this.deezerJwt;
	}

	async getDeezer(artist: string, song: string): Promise<LyricsResult | null> {
		const jwt = await this.getDeezerJwt();
		if (!jwt) return null;

		const searchData = await fetchJsonSafe<{ data?: Array<{ id: number }> }>(
			`https://api.deezer.com/search?${new URLSearchParams({ q: `${artist} ${song}` })}`,
		);
		const trackId = searchData?.data?.[0]?.id;
		if (!trackId) return null;

		const data = await fetchJsonSafe<{
			data?: { track?: { lyrics?: DeezerLyrics } };
		}>("https://pipe.deezer.com/api", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${jwt}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				operationName: "GetLyrics",
				variables: { trackId: String(trackId) },
				query: `query GetLyrics($trackId: String!) {
            track(trackId: $trackId) {
              lyrics {
                synchronizedWordByWordLines { start end words { word } }
                synchronizedLines { milliseconds duration line }
                text
              }
            }
          }`,
			}),
		});

		const lyrics = data?.data?.track?.lyrics;
		if (!lyrics) return null;

		if (lyrics.synchronizedWordByWordLines?.length) {
			const synced = lyrics.synchronizedWordByWordLines
				.map(
					(l) =>
						`${lrcTime(l.start)} ${l.words.map((w) => w.word).join(" ")}`,
				)
				.join("\n");
			return { synced, plain: syncedToPlain(synced), source: "deezer" };
		}
		if (lyrics.synchronizedLines?.length) {
			const synced = lyrics.synchronizedLines
				.map((l) => `${lrcTime(l.milliseconds)} ${l.line}`)
				.join("\n");
			return { synced, plain: syncedToPlain(synced), source: "deezer" };
		}
		if (lyrics.text)
			return { synced: null, plain: lyrics.text, source: "deezer" };
		return null;
	}

	async getGenius(artist: string, song: string): Promise<LyricsResult | null> {
		const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
		const searchData = await fetchJsonSafe<{
			response?: { sections?: GeniusSection[] };
		}>(
			`https://genius.com/api/search/multi?q=${encodeURIComponent(`${song} ${artist}`)}`,
			{ headers: { "user-agent": UA } },
		);
		const songResult = searchData?.response?.sections?.find(
			(s) => s.type === "song",
		)?.hits?.[0]?.result;
		if (!songResult?.path) return null;

		try {
			const pageRes = await fetch(`https://genius.com${songResult.path}`, {
				headers: { "user-agent": UA },
				signal: AbortSignal.timeout(REQUEST_TIMEOUT),
			});
			if (!pageRes.ok) return null;

			const html = await pageRes.text();
			const match = html.match(
				/window\.__PRELOADED_STATE__\s*=\s*JSON\.parse\('(.*)'\);/,
			);
			if (!match?.[1]) return null;

			const state = JSON.parse(match[1].replace(/\\(.)/g, "$1")) as {
				songPage?: { lyricsData?: { body?: { html?: string } } };
			};
			const lyricsHtml = state.songPage?.lyricsData?.body?.html;
			if (!lyricsHtml) return null;

			const plain = lyricsHtml
				.replace(/<br\s*\/?>/gi, "\n")
				.replace(/<[^>]*>/g, "")
				.split("\n")
				.map((l: string) => l.trim())
				.filter(Boolean)
				.join("\n");
			return plain ? { synced: null, plain, source: "genius" } : null;
		} catch {
			return null;
		}
	}

	/** Fetch lyrics from a single named source. Used for the "try other source" loop. */
	async getFromSource(
		source: LyricsSource,
		artist: string,
		song: string,
	): Promise<LyricsResult | null> {
		const cleanArtist = cleanText(artist);
		const cleanSong = cleanText(song);
		switch (source) {
			case "lrclib":
				return await this.getLrclib(cleanArtist, cleanSong);
			case "musixmatch":
				return await this.getMusixmatch(cleanArtist, cleanSong);
			case "deezer":
				return await this.getDeezer(cleanArtist, cleanSong);
			case "genius":
				return await this.getGenius(cleanArtist, cleanSong);
		}
	}

	/** Try every source in order, skipping any already-tried sources. First plain/synced hit wins. */
	async getLyricsSkipping(
		artist: string,
		song: string,
		tried: LyricsSource[],
	): Promise<LyricsResult | null> {
		const order: LyricsSource[] = [
			"lrclib",
			"musixmatch",
			"deezer",
			"genius",
		];
		const remaining = order.filter((s) => !tried.includes(s));

		for (const source of remaining) {
			const result = await this.getFromSource(source, artist, song).catch(
				() => null,
			);
			if (result?.synced) return result;
		}

		for (const source of remaining) {
			const result = await this.getFromSource(source, artist, song).catch(
				() => null,
			);
			if (result?.plain) return result;
		}
		return null;
	}
}
