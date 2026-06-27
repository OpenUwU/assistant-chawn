/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */
import {
	Client,
	Collection,
	GatewayIntentBits,
	Options,
	Partials,
} from "discord.js";
import type { Command } from "./types/index.js";

export class ExtendedClient extends Client {
	public readonly commands = new Collection<string, Command>();
	constructor() {
		super({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildVoiceStates,
			],
			partials: [Partials.Channel],
			allowedMentions: {
				parse: [],
				repliedUser: false,
			},
			makeCache: Options.cacheWithLimits({
				...Options.DefaultMakeCacheSettings,
				GuildMemberManager: {
					maxSize: Infinity,
					keepOverLimit: (member) => member.voice.channelId !== null,
				},
				MessageManager: {
					maxSize: Infinity,
					keepOverLimit: (message) => message.author?.id === this.user?.id,
				},
				PresenceManager: 0,
				ReactionManager: 0,
				ThreadManager: 0,
				StageInstanceManager: 0,
				GuildScheduledEventManager: 0,
				UserManager: 0,
			}),
			sweepers: {
				...Options.DefaultSweeperSettings,
				users: {
					interval: 3600,
					filter: () => () => true,
				},
				guildMembers: {
					interval: 300,
					filter: () => (member) => member.voice.channelId === null,
				},
				messages: {
					interval: 300,
					filter: () => (message) => message.author?.id !== this.user?.id,
				},
			},
		});
	}
}
