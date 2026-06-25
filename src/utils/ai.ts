/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import type {
	GroqChatRequest,
	GroqChatResponse,
	MarkdownBlock,
	NvidiaChatRequest,
	NvidiaChatResponse,
} from "../types/ai.js";
import { fetchJson, HttpError } from "./http.js";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";
const GROQ_MAX_COMPLETION_TOKENS = 5000;

const NVIDIA_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_MODEL = "openai/gpt-oss-120b";
const NVIDIA_MAX_TOKENS = 3500;

const TIMEOUT_MS = 100_000;

const AI_PAGE_SIZE = 1200;
const HARD_PAGE_SIZE = 1800;
const AI_PAGE_DELIMITER = "<<<PAGE>>>";

const SYSTEM_PROMPT =
	"You are replying inside Discord messages. Use Discord markdown only: " +
	"**bold**, *italic*, __underline__, ~~strikethrough~~, `inline code`, " +
	"fenced code blocks, '> ' for a blockquote, '>>> ' for a multi-line blockquote. " +
	"Never use HTML or LaTeX. " +
	`When your reply would exceed ${AI_PAGE_SIZE} characters, insert the exact token <<<PAGE>>> ` +
	"on its own line to start a new page. Rules: never break mid-sentence, never split a " +
	"fenced code block or blockquote across pages — always close the current block first, " +
	"then insert <<<PAGE>>>. Never close inline formatting (**bold**, *italic*, etc.) across " +
	"a page boundary — finish the span on the same page. " +
	"Use short paragraphs and prefer '- ' bullet points and >,>>>  over walls of text. dont add '---' in your responses as discord can't render it" +
	"Only answer what was explicitly asked — no extra context, caveats, or padding. ";

export class AiError extends Error {}

function tokenise(text: string): MarkdownBlock[] {
	const blocks: MarkdownBlock[] = [];
	const fenceRe = /^(`{3,})([^\n]*)\n[\s\S]*?\1[ \t]*$/gm;
	let last = 0;

	for (const m of text.matchAll(fenceRe)) {
		if ((m.index ?? 0) > last) {
			blocks.push({ kind: "text", raw: text.slice(last, m.index ?? 0) });
		}
		blocks.push({ kind: "code", lang: m[2].trim(), raw: m[0] });
		last = (m.index ?? 0) + m[0].length;
	}
	if (last < text.length) {
		blocks.push({ kind: "text", raw: text.slice(last) });
	}

	const expanded: MarkdownBlock[] = [];
	for (const block of blocks) {
		if (block.kind !== "text") {
			expanded.push(block);
			continue;
		}
		const bqRe = /(?:^(?:>{1,3}) [^\n]*(?:\n|$))+/gm;
		let pos = 0;
		for (const m of block.raw.matchAll(bqRe)) {
			if ((m.index ?? 0) > pos) {
				expanded.push({
					kind: "text",
					raw: block.raw.slice(pos, m.index ?? 0),
				});
			}
			expanded.push({ kind: "blockquote", raw: m[0].trimEnd() });
			pos = (m.index ?? 0) + m[0].length;
		}
		if (pos < block.raw.length) {
			expanded.push({ kind: "text", raw: block.raw.slice(pos) });
		}
	}

	return expanded.filter((b) => b.raw.trim());
}

const SPAN_PAIRS: [RegExp, string][] = [
	[/\*\*/g, "**"],
	[/(?<!\*)\*(?!\*)/g, "*"],
	[/__/g, "__"],
	[/~~/g, "~~"],
	[/(?<!`)`(?!`)/g, "`"],
];

function hasUnclosedSpans(text: string): boolean {
	for (const [re] of SPAN_PAIRS) {
		const count = (text.match(re) ?? []).length;
		if (count % 2 !== 0) return true;
	}
	return false;
}

function lastSentenceBoundary(text: string, limit: number): number {
	const slice = text.slice(0, limit);
	const stripped = slice.replace(/`[^`]*`/g, (m) => " ".repeat(m.length));

	let best = -1;
	for (let i = stripped.length - 1; i >= Math.floor(limit * 0.4); i--) {
		const ch = stripped[i];
		if (
			(ch === "." || ch === "!" || ch === "?") &&
			/\s/.test(stripped[i + 1] ?? " ")
		) {
			best = i + 1;
			break;
		}
	}
	return best;
}

function splitTextSafe(text: string, limit: number): string[] {
	const parts: string[] = [];
	let remaining = text.trim();

	while (remaining.length > limit) {
		const slice = remaining.slice(0, limit);

		const atParagraph = slice.lastIndexOf("\n\n");
		const atNewline = slice.lastIndexOf("\n");
		const atSentence = lastSentenceBoundary(remaining, limit);

		let cut: number;
		if (atParagraph > limit * 0.4) {
			cut = atParagraph + 2;
		} else if (atSentence > 0) {
			cut = atSentence;
		} else if (atNewline > limit * 0.4) {
			cut = atNewline + 1;
		} else {
			cut = limit;
		}

		let chunk = remaining.slice(0, cut).trimEnd();

		if (hasUnclosedSpans(chunk)) {
			const lastSpace = chunk.lastIndexOf(" ");
			if (lastSpace > limit * 0.3)
				chunk = chunk.slice(0, lastSpace).trimEnd();
		}

		parts.push(chunk);
		remaining = remaining.slice(chunk.length).trimStart();
	}

	if (remaining.trim()) parts.push(remaining.trimEnd());
	return parts;
}

export function paginateForDiscord(
	text: string,
	pageSize = HARD_PAGE_SIZE,
): string[] {
	const pages: string[] = [];
	let current = "";

	const flush = () => {
		const trimmed = current.trimEnd();
		if (trimmed) pages.push(trimmed);
		current = "";
	};

	for (const block of tokenise(text)) {
		const raw = block.raw.trimEnd();

		if (block.kind === "code" || block.kind === "blockquote") {
			const candidate = current ? `${current}\n\n${raw}` : raw;
			if (candidate.length <= pageSize) {
				current = candidate;
			} else if (raw.length > pageSize) {
				flush();
				const parts = splitTextSafe(raw, pageSize);
				for (let i = 0; i < parts.length - 1; i++) pages.push(parts[i]);
				current = parts.at(-1) ?? "";
			} else {
				flush();
				current = raw;
			}
			continue;
		}

		for (const para of raw.split(/\n\n+/)) {
			const p = para.trim();
			if (!p) continue;

			const candidate = current ? `${current}\n\n${p}` : p;

			if (candidate.length <= pageSize) {
				current = candidate;
				continue;
			}

			if (p.length <= pageSize) {
				flush();
				current = p;
				continue;
			}

			flush();
			const parts = splitTextSafe(p, pageSize);
			for (let i = 0; i < parts.length - 1; i++) pages.push(parts[i]);
			current = parts.at(-1) ?? "";
		}
	}

	flush();
	return pages.length ? pages : [""];
}

function splitOnAiDelimiter(text: string): string[] {
	return text
		.split(new RegExp(`^${AI_PAGE_DELIMITER}$`, "m"))
		.map((p) => p.trim())
		.filter(Boolean);
}

function buildPages(reply: string): string[] {
	const aiChunks = splitOnAiDelimiter(reply);
	const pages: string[] = [];
	for (const chunk of aiChunks) {
		pages.push(...paginateForDiscord(chunk, AI_PAGE_SIZE));
	}
	return pages.length ? pages : [""];
}

async function tryGroq(prompt: string): Promise<string[]> {
	const apiKey = process.env.GROQ_API_KEY;
	if (!apiKey) throw new AiError("GROQ_API_KEY is not set.");

	const data = await fetchJson<GroqChatResponse>(
		GROQ_ENDPOINT,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				model: GROQ_MODEL,
				messages: [
					{ role: "system", content: SYSTEM_PROMPT },
					{ role: "user", content: prompt },
				],
				max_completion_tokens: GROQ_MAX_COMPLETION_TOKENS,
				temperature: 0.6,
				top_p: 0.7,
				reasoning_effort: "medium",
				stream: false,
				stop: null,
				tools: [{ type: "browser_search" }],
			} satisfies GroqChatRequest),
		},
		TIMEOUT_MS,
	);

	const reply = data.choices[0]?.message?.content?.trim();
	if (!reply) throw new AiError("Groq returned an empty response.");
	return buildPages(reply);
}

async function tryNvidia(prompt: string): Promise<string[]> {
	const apiKey = process.env.NVIDIA_API_KEY;
	if (!apiKey) throw new AiError("NVIDIA_API_KEY is not set.");

	const data = await fetchJson<NvidiaChatResponse>(
		NVIDIA_ENDPOINT,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				model: NVIDIA_MODEL,
				messages: [
					{ role: "system", content: SYSTEM_PROMPT },
					{ role: "user", content: prompt },
				],
				max_tokens: NVIDIA_MAX_TOKENS,
				temperature: 0.6,
				reasoning_effort: "medium",
				top_p: 0.7,
				stream: false,
			} satisfies NvidiaChatRequest),
		},
		TIMEOUT_MS,
	);

	const reply = data.choices[0]?.message?.content?.trim();
	if (!reply) throw new AiError("Nvidia returned an empty response.");
	return buildPages(reply);
}

export async function generateText(prompt: string): Promise<string[]> {
	if (!process.env.GROQ_API_KEY && !process.env.NVIDIA_API_KEY) {
		throw new AiError("AI is not configured on this bot.");
	}

	if (process.env.GROQ_API_KEY) {
		try {
			return await tryGroq(prompt);
		} catch (err) {
			if (err instanceof AiError && !process.env.NVIDIA_API_KEY) throw err;
		}
	}

	try {
		return await tryNvidia(prompt);
	} catch (err) {
		if (err instanceof AiError) throw err;
		const status = err instanceof HttpError ? ` (${err.status})` : "";
		throw new AiError(`Failed to get a response from the AI${status}.`);
	}
}
