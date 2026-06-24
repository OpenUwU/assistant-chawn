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
	stream: false;
}

export interface NvidiaChatResponse {
	choices: Array<{
		message: { role: string; content: string };
	}>;
}
