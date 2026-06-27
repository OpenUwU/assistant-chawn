/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import type { Queue } from "discolink";
import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	ClientEvents,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
	VoiceBasedChannel,
} from "discord.js";

export type SlashCommandData =
	| SlashCommandBuilder
	| SlashCommandOptionsOnlyBuilder
	| SlashCommandSubcommandsOnlyBuilder;

export interface CommandContext {
	userVoice: VoiceBasedChannel | null;
	botVoice: VoiceBasedChannel | null;
	queue: Queue | null;
}

export interface Command {
	data: SlashCommandData;
	skipAutoDefer?: boolean;
	ownerOnly?: boolean;
	voiceRequired?: boolean;
	sameVoiceRequired?: boolean;
	queueRequired?: boolean;
	ActiveQueueRequired?: boolean;
	restrictive?: boolean;
	autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
	execute: (
		interaction: ChatInputCommandInteraction,
		context: CommandContext,
	) => Promise<void>;
}
export interface BotEvent<K extends keyof ClientEvents = keyof ClientEvents> {
	name: K;
	once?: boolean;
	execute: (...args: ClientEvents[K]) => Promise<void> | void;
}

// For events not present in discord.js's ClientEvents (e.g. "raw"),
// where the payload type can't be inferred generically.
export interface RawBotEvent {
	name: string;
	once?: boolean;
	execute: (payload: unknown) => Promise<void> | void;
}
