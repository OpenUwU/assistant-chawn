/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import {
	ApplicationIntegrationType,
	ComponentType,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../../types/index.js";
import { AiError, generateText } from "../../utils/ai.js";
import {
	ActionRow,
	baseContainer,
	errorContainer,
	secondaryButton,
	TextDisplay,
} from "../../utils/components.js";
import { logger } from "../../utils/logger.js";

const COLLECTOR_TIMEOUT_MS = 5 * 60 * 1000;

function buildContainer(page: string, index: number, total: number) {
	return baseContainer().addTextDisplayComponents(
		TextDisplay(page),
		TextDisplay(`-# page ${index + 1} of ${total}`),
	);
}

function buildButtons(index: number, total: number, disableAll = false) {
	const prev = secondaryButton("prev", "ai_prev", disableAll || index === 0);
	const page = secondaryButton(`${index + 1}/${total}`, "ai_page", true);
	const next = secondaryButton(
		"next",
		"ai_next",
		disableAll || index === total - 1,
	);
	return ActionRow().addComponents(prev, page, next);
}

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
				const pages = await generateText(prompt);
				const total = pages.length;
				let index = 0;

				const response = await interaction.editReply({
					components: [
						buildContainer(
							pages[index],
							index,
							total,
						).addActionRowComponents(
							buildButtons(index, total, total === 1),
						),
					],
					flags: MessageFlags.IsComponentsV2,
				});

				if (total === 1) return;

				const collector = response.createMessageComponentCollector({
					componentType: ComponentType.Button,
					filter: (i) => i.user.id === interaction.user.id,
					time: COLLECTOR_TIMEOUT_MS,
				});

				collector.on("collect", async (i) => {
					if (i.customId === "ai_prev") {
						index = Math.max(0, index - 1);
					} else if (i.customId === "ai_next") {
						index = Math.min(total - 1, index + 1);
					}

					await i.update({
						components: [
							buildContainer(
								pages[index],
								index,
								total,
							).addActionRowComponents(buildButtons(index, total)),
						],
						flags: MessageFlags.IsComponentsV2,
					});
				});

				collector.on("end", async () => {
					try {
						await interaction.editReply({
							components: [
								buildContainer(
									pages[index],
									index,
									total,
								).addActionRowComponents(
									buildButtons(index, total, true),
								),
							],
							flags: MessageFlags.IsComponentsV2,
						});
					} catch {
						// message may have been deleted; ignore
					}
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
