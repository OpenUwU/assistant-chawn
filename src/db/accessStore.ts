/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import { mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, "../../data");
mkdirSync(DIR, { recursive: true });

const FILE = join(DIR, "access.json");

interface AccessEntry {
	grantedBy: string;
	grantedAt: number;
}

interface AccessStore {
	authorizedUsers: Record<string, AccessEntry>;
}

let writeQueue: Promise<void> = Promise.resolve();

async function read(): Promise<AccessStore> {
	try {
		return JSON.parse(await readFile(FILE, "utf-8")) as AccessStore;
	} catch {
		return { authorizedUsers: {} };
	}
}

function enqueueWrite(data: AccessStore): void {
	writeQueue = writeQueue
		.then(() => writeFile(FILE, JSON.stringify(data, null, 2)))
		.then(() => {});
}

export async function hasAccess(userId: string): Promise<boolean> {
	const data = await read();
	return userId in data.authorizedUsers;
}

export async function grantAccess(
	userId: string,
	grantedBy: string,
): Promise<void> {
	const data = await read();
	if (!(userId in data.authorizedUsers)) {
		data.authorizedUsers[userId] = { grantedBy, grantedAt: Date.now() };
		enqueueWrite(data);
	}
}

export async function revokeAccess(userId: string): Promise<void> {
	const data = await read();
	if (userId in data.authorizedUsers) {
		delete data.authorizedUsers[userId];
		enqueueWrite(data);
	}
}

export async function listAuthorized(): Promise<
	Array<{ userId: string; grantedBy: string; grantedAt: number }>
> {
	const data = await read();
	return Object.entries(data.authorizedUsers).map(([userId, entry]) => ({
		userId,
		...entry,
	}));
}
