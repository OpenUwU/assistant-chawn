import type { ChatInputCommandInteraction } from "discord.js";
import { MessageFlags } from "discord.js";
import { hasAccess } from "../db/accessStore.js";
import { errorContainer } from "./components.js";

export function getOwnerIds(): Set<string> {
	const raw = process.env.OWNER_IDS ?? "";
	return new Set(
		raw
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean),
	);
}

export function isOwner(userId: string): boolean {
	return getOwnerIds().has(userId);
}

export function isRestrictiveModeEnabled(): boolean {
	return process.env.RESTRICTIVE_MODE === "true";
}

export async function checkAccess(
	interaction: ChatInputCommandInteraction,
): Promise<boolean> {
	const userId = interaction.user.id;

	if (isOwner(userId)) return true;

	if (await hasAccess(userId)) return true;

	await interaction.editReply({
		components: [errorContainer("You don't have access to this command.")],
		flags: MessageFlags.IsComponentsV2,
	});

	return false;
}
