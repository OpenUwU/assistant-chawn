import { EmbedBuilder } from "discord.js";

const BRAND_COLOR = 0x5865f2; // Discord blurple — swap for your own brand color
const ERROR_COLOR = 0xed4245;

export function baseEmbed(): EmbedBuilder {
	return new EmbedBuilder().setColor(BRAND_COLOR).setTimestamp();
}

export function errorEmbed(message: string): EmbedBuilder {
	return new EmbedBuilder()
		.setColor(ERROR_COLOR)
		.setDescription(`Bhenchod Erorr: ${message}`);
}
