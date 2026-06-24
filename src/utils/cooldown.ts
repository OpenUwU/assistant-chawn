/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

const COOLDOWN_MS = 5000;
const SWEEP_INTERVAL_MS = 60_000;

const expiries = new Map<string, number>();

export function getRemainingCooldown(userId: string): number {
	const expiresAt = expiries.get(userId);
	if (!expiresAt) return 0;

	const remaining = expiresAt - Date.now();
	if (remaining <= 0) {
		expiries.delete(userId);
		return 0;
	}
	return remaining;
}

export function applyCooldown(userId: string): void {
	expiries.set(userId, Date.now() + COOLDOWN_MS);
}

const sweeper = setInterval(() => {
	const now = Date.now();
	for (const [userId, expiresAt] of expiries) {
		if (expiresAt <= now) expiries.delete(userId);
	}
}, SWEEP_INTERVAL_MS);

sweeper.unref();
