/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

export interface NvidiaMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

export interface NvidiaChatRequest {
	model: string;
	messages: NvidiaMessage[];
	max_tokens?: number;
	temperature: number;
	top_p: number;
	reasoning_budget?: number;
	reasoning_effort?: "high" | "low" | "max" | "medium";
	stream: false;
}

export interface NvidiaChatResponse {
	choices: Array<{
		message: { role: string; content: string };
	}>;
}

export interface GroqMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

export interface GroqTool {
	type: "browser_search";
}

export interface GroqChatRequest {
	model: string;
	messages: GroqMessage[];
	max_completion_tokens: number;
	temperature: number;
	top_p: number;
	reasoning_effort?: "none" | "default" | "low" | "medium" | "high";
	stream: false;
	stop: null;
	tools?: GroqTool[];
}

export interface GroqChatResponse {
	choices: Array<{
		message: { role: string; content: string };
	}>;
}

export type MarkdownBlock =
	| { kind: "code"; lang: string; raw: string }
	| { kind: "blockquote"; raw: string }
	| { kind: "text"; raw: string };
