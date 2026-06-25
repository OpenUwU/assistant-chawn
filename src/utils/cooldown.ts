/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import { getRedis } from "../db/redis.js";

const COOLDOWN_MS = 5000;
export async function getRemainingCooldown(userId: string): Promise<number> {
	const raw = await getRedis().get(`cooldown:${userId}`);
	if (!raw) return 0;

	const expiresAt = Number(raw);
	if (Number.isNaN(expiresAt)) return 0;

	const remaining = expiresAt - Date.now();
	return remaining > 0 ? remaining : 0;
}

export async function applyCooldown(userId: string): Promise<"OK"> {
	const expiresAt = Date.now() + COOLDOWN_MS;
	return await getRedis().set(
		`cooldown:${userId}`,
		String(expiresAt),
		"PX",
		COOLDOWN_MS,
	);
}
