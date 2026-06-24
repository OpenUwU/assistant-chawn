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
	max_tokens: number;
	temperature: number;
	top_p: number;
	reasoning_budget?: number;
	reasoning_effort?: "high" | "low" | "max";
	stream: false;
}

export interface NvidiaChatResponse {
	choices: Array<{
		message: { role: string; content: string };
	}>;
}
