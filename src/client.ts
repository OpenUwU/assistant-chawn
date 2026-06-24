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
			intents: [GatewayIntentBits.Guilds],
			partials: [Partials.Channel],
			allowedMentions: {
				parse: [],
				repliedUser: false,
			},

			makeCache: Options.cacheWithLimits({
				...Options.DefaultMakeCacheSettings,
				MessageManager: 0,
				PresenceManager: 0,
				ReactionManager: 0,
				ThreadManager: 0,
				StageInstanceManager: 0,
				GuildScheduledEventManager: 0,
				GuildMemberManager: 0,
				UserManager: 0,
			}),

			sweepers: {
				...Options.DefaultSweeperSettings,
				users: {
					interval: 3600,
					filter: () => () => true,
				},
			},
		});
	}
}
