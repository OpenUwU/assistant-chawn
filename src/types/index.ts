import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	ClientEvents,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import type { ExtendedClient } from "../client.js";

export type SlashCommandData =
	| SlashCommandBuilder
	| SlashCommandOptionsOnlyBuilder
	| SlashCommandSubcommandsOnlyBuilder;

export interface Command {
	data: SlashCommandData;
	skipAutoDefer?: boolean;
	ownerOnly?: boolean;
	restrictive?: boolean;
	autocomplete?: (
		interaction: AutocompleteInteraction,
		client: ExtendedClient,
	) => Promise<void>;
	execute: (
		interaction: ChatInputCommandInteraction,
		client: ExtendedClient,
	) => Promise<void>;
}

export interface BotEvent<K extends keyof ClientEvents = keyof ClientEvents> {
	name: K;
	once?: boolean;
	execute: (...args: ClientEvents[K]) => Promise<void> | void;
}
