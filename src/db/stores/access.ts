/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import { BaseStore } from "../store.js";

interface AccessRow {
	user_id: string;
	granted_by: string;
	granted_at: string;
}

export interface AccessEntry {
	userId: string;
	grantedBy: string;
	grantedAt: number;
}

const store = new BaseStore<AccessRow, AccessEntry, "user_id">({
	table: "access",
	keyPrefix: "access",
	primaryKey: "user_id",

	fromRow: (row): AccessEntry => ({
		userId: row.user_id,
		grantedBy: row.granted_by,
		grantedAt: Number(row.granted_at),
	}),

	buildUpsert: (entity): [string, unknown[]] => [
		`INSERT INTO access (user_id, granted_by, granted_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE
       SET user_id = EXCLUDED.user_id
     RETURNING *`,
		[entity.userId, entity.grantedBy, entity.grantedAt],
	],
});

export async function hasAccess(userId: string): Promise<boolean> {
	return await store.has(userId);
}

/**
 * Grant access to a user. Idempotent.
 * Returns true if newly granted, false if the user already had access.
 */
export async function grantAccess(
	userId: string,
	grantedBy: string,
): Promise<boolean> {
	if (await store.has(userId)) return false;
	await store.set({ userId, grantedBy, grantedAt: Date.now() });
	return true;
}

export async function revokeAccess(userId: string): Promise<void> {
	await store.delete(userId);
}

export async function listAuthorized(): Promise<AccessEntry[]> {
	return await store.getAll();
}

export async function hydrateAccess(): Promise<void> {
	await store.hydrate();
}
