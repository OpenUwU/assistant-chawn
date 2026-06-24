/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import {
	ApplicationIntegrationType,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../../types/index.js";
import { AiError, generateText } from "../../utils/ai.js";
import {
	baseContainer,
	errorContainer,
	TextDisplay,
} from "../../utils/components.js";
import { logger } from "../../utils/logger.js";

const command: Command = {
	restrictive: true,
	data: new SlashCommandBuilder()
		.setName("ai")
		.setDescription("Use the bot's AI tools.")
		.addSubcommand((sub) =>
			sub
				.setName("text")
				.setDescription("Ask the AI a question.")
				.addStringOption((o) =>
					o
						.setName("prompt")
						.setDescription("What do you want to ask?")
						.setRequired(true)
						.setMaxLength(1000),
				),
		)
		.setIntegrationTypes(ApplicationIntegrationType.UserInstall)
		.setContexts(
			InteractionContextType.Guild,
			InteractionContextType.BotDM,
			InteractionContextType.PrivateChannel,
		),

	execute: async (interaction) => {
		const sub = interaction.options.getSubcommand();

		if (sub === "text") {
			const prompt = interaction.options.getString("prompt", true);

			try {
				const reply = await generateText(prompt);
				await interaction.editReply({
					components: [
						baseContainer().addTextDisplayComponents(TextDisplay(reply)),
					],
					flags: MessageFlags.IsComponentsV2,
				});
			} catch (err) {
				logger.error(`/ai text failed: ${(err as Error).message}`);
				await interaction.editReply({
					components: [
						errorContainer(
							err instanceof AiError
								? err.message
								: "Something went wrong running that command.",
						),
					],
					flags: MessageFlags.IsComponentsV2,
				});
			}
		}
	},
};

export default command;
