import {
	ApplicationIntegrationType,
	ComponentType,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../../types/index.js";
import {
	ACTION_STRINGS,
	allCategoryKeys,
	buildContainer,
	randomNum,
} from "../../utils/roleplayData.js";

const cmdCategories = allCategoryKeys.slice(0, 25);

const builder = new SlashCommandBuilder()
	.setName("roleplay1")
	.setDescription("Send an anime roleplay GIF ")
	.setIntegrationTypes(
		ApplicationIntegrationType.UserInstall,
		ApplicationIntegrationType.GuildInstall,
	)
	.setContexts(
		InteractionContextType.Guild,
		InteractionContextType.BotDM,
		InteractionContextType.PrivateChannel,
	);

cmdCategories.forEach((actionName) => {
	builder.addSubcommand((sub) =>
		sub
			.setName(actionName)
			.setDescription(`Send a ${actionName} gif`)
			.addUserOption((opt) =>
				opt
					.setName("user")
					.setDescription("Target user (leave empty to do it solo)")
					.setRequired(false),
			),
	);
});

const command: Command = {
	data: builder,
	execute: async (interaction) => {
		const action = interaction.options.getSubcommand();
		const target = interaction.options.getUser("user");
		const strings = ACTION_STRINGS[action];
		const author = `**${interaction.user.displayName}**`;

		let text: string;
		if (target) {
			text = `${author} ${strings.at.replace("{target}", `**${target.displayName}**`)}`;
		} else {
			text = `${author} ${strings.solo}`;
		}

		let currentNum = randomNum(action);
		const message = await interaction.editReply({
			components: [buildContainer(text, action, currentNum)],
			flags: MessageFlags.IsComponentsV2,
		});

		const collector = message.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 60_000,
			filter: (i) => {
				if (i.user.id !== interaction.user.id) {
					i.reply({
						content: "This isn't your roleplay.",
						flags: MessageFlags.Ephemeral,
					});
					return false;
				}
				return true;
			},
		});

		collector.on("collect", async (i) => {
			currentNum = randomNum(action, currentNum);
			await i.update({
				components: [buildContainer(text, action, currentNum)],
				flags: MessageFlags.IsComponentsV2,
			});
		});

		collector.on("end", async () => {
			await interaction
				.editReply({
					components: [buildContainer(text, action, currentNum, true)],
					flags: MessageFlags.IsComponentsV2,
				})
				.catch(() => {});
		});
	},
};

export default command;
