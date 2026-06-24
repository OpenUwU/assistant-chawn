/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import type { NvidiaChatRequest, NvidiaChatResponse } from "../types/ai.js";
import { fetchJson, HttpError } from "./http.js";

const ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";
const MODEL = "z-ai/glm-5.1";
const MAX_TOKENS = 1500;
const SAFE_LIMIT = 3800;
const TIMEOUT_MS = 100_000;

const SYSTEM_PROMPT =
	"You are replying inside a single Discord message. Use Discord markdown " +
	"only: **bold**, *italic*, __underline__, ~~strikethrough~~, `inline code`, " +
	"fenced code blocks, '> ' for a blockquote, and '>>> ' for a multi-line " +
	"blockquote. Never use HTML or LaTeX. Keep the entire reply under 3500 " +
	"characters, use short paragraphs, and prefer '- ' bullet points over long " +
	"walls of text. Only answer what was explicitly asked, with no extra " +
	"context, caveats, or unrelated information. the following is the user's prompt: ";

export class AiError extends Error {}

export function clampForDiscord(text: string, limit = SAFE_LIMIT): string {
	if (text.length <= limit) return text;

	const sliced = text.slice(0, limit);
	const lastParagraph = sliced.lastIndexOf("\n\n");
	const lastSentence = sliced.lastIndexOf(". ");
	const cutAt = Math.max(lastParagraph, lastSentence);
	const safeCut = cutAt > limit * 0.6 ? sliced.slice(0, cutAt + 1) : sliced;

	return `${safeCut.trimEnd()}\n\n-# response truncated to fit Discord's limits`;
}

export async function generateText(prompt: string): Promise<string> {
	const apiKey = process.env.NVIDIA_API_KEY;
	if (!apiKey) throw new AiError("AI is not configured on this bot.");

	try {
		const data = await fetchJson<NvidiaChatResponse>(
			ENDPOINT,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					model: MODEL,
					messages: [
						{ role: "system", content: SYSTEM_PROMPT },
						{ role: "user", content: prompt },
					],
					max_tokens: MAX_TOKENS,
					temperature: 1,
					reasoning_effort: "high",
					top_p: 0.95,
					stream: false,
				} satisfies NvidiaChatRequest),
			},
			TIMEOUT_MS,
		);

		const reply = data.choices[0]?.message?.content?.trim();
		if (!reply) throw new AiError("The AI returned an empty response.");

		return clampForDiscord(reply);
	} catch (err) {
		if (err instanceof AiError) throw err;
		const status = err instanceof HttpError ? ` (${err.status})` : "";
		throw new AiError(`Failed to get a response from the AI${status}.`);
	}
}
