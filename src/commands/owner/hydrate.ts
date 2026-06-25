/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import { SlashCommandBuilder } from "discord.js";
import { hydrateAll } from "../../db/index.js";
import type { Command } from "../../types/index.js";

const command: Command = {
	ownerOnly: true,
	data: new SlashCommandBuilder()
		.setName("hydrate")
		.setDescription("Hydrate the cache."),
	execute: async (interaction) => {
		await hydrateAll();
		await interaction.editReply({ content: "Hydrated the cache!" });
	},
};
export default command;
