/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelSelectMenuBuilder,
	ContainerBuilder,
	EmbedBuilder,
	type MessageActionRowComponentBuilder,
	RoleSelectMenuBuilder,
	SectionBuilder,
	type SelectMenuComponentOptionData,
	SeparatorBuilder,
	SeparatorSpacingSize,
	StringSelectMenuBuilder,
	TextDisplayBuilder,
	ThumbnailBuilder,
	UserSelectMenuBuilder,
} from "discord.js";

const BRAND_COLOR = Number(process.env.BRAND_COLOR) || 0x5865f2;
const ERROR_COLOR = Number(process.env.ERROR_COLOR) || 0xed4245;

export function baseEmbed(): EmbedBuilder {
	return new EmbedBuilder().setColor(BRAND_COLOR).setTimestamp();
}

export function errorEmbed(message: string): EmbedBuilder {
	return new EmbedBuilder()
		.setColor(ERROR_COLOR)
		.setDescription(`Bhenchod Erorr: ${message}`);
}

export function errorContainer(message: string): ContainerBuilder {
	return new ContainerBuilder()
		.setAccentColor(ERROR_COLOR)
		.addTextDisplayComponents(TextDisplay("Something Went Wrong!"))
		.addSeparatorComponents(Separator())
		.addTextDisplayComponents(TextDisplay(`>>> ${message}`));
}

export function baseContainer(): ContainerBuilder {
	return new ContainerBuilder().setAccentColor(BRAND_COLOR);
}

export function baseSection(): SectionBuilder {
	return new SectionBuilder();
}

export function TextDisplay(content: string): TextDisplayBuilder {
	return new TextDisplayBuilder().setContent(content);
}

export function Thumbnail(description: string, url: string): ThumbnailBuilder {
	return new ThumbnailBuilder().setDescription(description).setURL(url);
}

export function Separator(
	divider = true,
	size: SeparatorSpacingSize = SeparatorSpacingSize.Small,
): SeparatorBuilder {
	return new SeparatorBuilder().setDivider(divider).setSpacing(size);
}

export function baseButton(): ButtonBuilder {
	return new ButtonBuilder();
}

export function linkButton(label: string, url: string): ButtonBuilder {
	return new ButtonBuilder().setLabel(label).setURL(url);
}

export function primaryButton(label: string, customId: string): ButtonBuilder {
	return new ButtonBuilder()
		.setLabel(label)
		.setStyle(ButtonStyle.Primary)
		.setCustomId(customId);
}

export function secondaryButton(
	label: string,
	customId: string,
): ButtonBuilder {
	return new ButtonBuilder()
		.setLabel(label)
		.setStyle(ButtonStyle.Secondary)
		.setCustomId(customId);
}

export function successButton(label: string, customId: string): ButtonBuilder {
	return new ButtonBuilder()
		.setLabel(label)
		.setStyle(ButtonStyle.Success)
		.setCustomId(customId);
}

export function dangerButton(label: string, customId: string): ButtonBuilder {
	return new ButtonBuilder()
		.setLabel(label)
		.setStyle(ButtonStyle.Danger)
		.setCustomId(customId);
}

export function ActionRow(): ActionRowBuilder<MessageActionRowComponentBuilder> {
	return new ActionRowBuilder<MessageActionRowComponentBuilder>();
}

export function SelectMenu(
	placeholder: string,
	options: SelectMenuComponentOptionData[],
	customId: string,
	min: number,
	max: number,
	disabled = false,
): StringSelectMenuBuilder {
	return new StringSelectMenuBuilder()
		.setPlaceholder(placeholder)
		.addOptions(options)
		.setDisabled(disabled)
		.setCustomId(customId)
		.setMinValues(min)
		.setMaxValues(max);
}

export function UserSelectMenu(
	placeholder: string,
	customId: string,
	min: number,
	max: number,
	defaultUsers: string[],
	disabled = false,
): UserSelectMenuBuilder {
	return new UserSelectMenuBuilder()
		.setDisabled(disabled)
		.setCustomId(customId)
		.setPlaceholder(placeholder)
		.setDefaultUsers(defaultUsers)
		.setMaxValues(max)
		.setMinValues(min);
}

export function RoleSelectMenu(
	placeholder: string,
	customId: string,
	min: number,
	max: number,
	defaultRoles: string[],
	disabled = false,
): RoleSelectMenuBuilder {
	return new RoleSelectMenuBuilder()
		.setDisabled(disabled)
		.setCustomId(customId)
		.setPlaceholder(placeholder)
		.setDefaultRoles(defaultRoles)
		.setMaxValues(max)
		.setMinValues(min);
}

export function ChannelSelectMenu(
	placeholder: string,
	customId: string,
	min: number,
	max: number,
	defaultChannels: string[],
	disabled = false,
): ChannelSelectMenuBuilder {
	return new ChannelSelectMenuBuilder()
		.setDisabled(disabled)
		.setCustomId(customId)
		.setPlaceholder(placeholder)
		.setDefaultChannels(defaultChannels)
		.setMaxValues(max)
		.setMinValues(min);
}
