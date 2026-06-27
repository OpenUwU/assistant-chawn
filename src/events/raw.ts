/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import { Events } from "discord.js";
import { player } from "../index.js";
import type { RawBotEvent } from "../types/index.js";

const event: RawBotEvent = {
	name: Events.Raw,
	execute: async (payload: unknown) => {
		player.voices.handleDispatch(payload);
	},
};

export default event;
