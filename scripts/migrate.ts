/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 *
 * Usage:
 *   bun run scripts/migrate.ts        # apply all pending migrations
 *   bun run scripts/migrate.ts --dry  # print SQL without touching PG
 *
 * Naming convention: NNN_description.sql (e.g. 001_init.sql)
 * Files are applied in lexicographic order and never re-applied.
 * To change schema, add a new file — never edit an existing one.
 */

import "dotenv/config";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_DIR = join(__dirname, "../src/db/schema");
const DRY = process.argv.includes("--dry");

const ESC = "\x1b";
const CLR = `${ESC}[0m`;
const log = {
	info: (msg: string) => console.log(`${ESC}[36m[migrate] ${msg}${CLR}`),
	success: (msg: string) => console.log(`${ESC}[32m[migrate] ${msg}${CLR}`),
	warn: (msg: string) => console.warn(`${ESC}[33m[migrate] ${msg}${CLR}`),
	error: (msg: string) => console.error(`${ESC}[31m[migrate] ${msg}${CLR}`),
	dim: (msg: string) => console.log(`${ESC}[90m${msg}${CLR}`),
};

function sha256(content: string): string {
	return createHash("sha256").update(content, "utf-8").digest("hex");
}

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		log.error("DATABASE_URL is not set. Aborting.");
		process.exit(1);
	}

	const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
	const client = await pool.connect();

	try {
		await client.query(`
			CREATE TABLE IF NOT EXISTS _migrations (
				filename     TEXT        NOT NULL PRIMARY KEY,
				content_hash TEXT        NOT NULL DEFAULT '',
				applied_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)
		`);

		await client.query(`
			ALTER TABLE _migrations
				ADD COLUMN IF NOT EXISTS content_hash TEXT NOT NULL DEFAULT ''
		`);

		const { rows } = await client.query<{
			filename: string;
			content_hash: string;
		}>("SELECT filename, content_hash FROM _migrations ORDER BY filename");
		const applied = new Map(rows.map((r) => [r.filename, r.content_hash]));

		const allFiles = (await readdir(SCHEMA_DIR))
			.filter((f) => f.endsWith(".sql"))
			.sort();

		for (const filename of allFiles) {
			if (applied.has(filename)) {
				const hash = sha256(
					await readFile(join(SCHEMA_DIR, filename), "utf-8"),
				);
				if (applied.get(filename) !== hash) {
					log.warn(
						`${filename} has been modified after being applied — create a new migration file instead of editing an existing one.`,
					);
				}
			}
		}

		const pending = allFiles.filter((f) => !applied.has(f));

		if (pending.length === 0) {
			log.info("No pending migrations. Database is up to date.");
			return;
		}

		log.info(`Pending: ${pending.join(", ")}`);
		if (DRY) log.warn("--dry mode: no changes will be made.");

		for (const filename of pending) {
			const sql = await readFile(join(SCHEMA_DIR, filename), "utf-8");
			const hash = sha256(sql);

			log.info(`Applying ${filename}…`);

			if (DRY) {
				log.dim(sql.trim());
				continue;
			}

			await client.query("BEGIN");
			try {
				await client.query(sql);
				await client.query(
					`INSERT INTO _migrations (filename, content_hash)
					 VALUES ($1, $2)`,
					[filename, hash],
				);
				await client.query("COMMIT");
				log.success(`✓ ${filename}`);
			} catch (err) {
				await client.query("ROLLBACK");
				log.error(`✗ ${filename} failed — rolled back. Stopping.`);
				throw err;
			}
		}

		if (!DRY) log.success(`Done. Applied ${pending.length} migration(s).`);
	} finally {
		client.release();
		await pool.end();
	}
}

main().catch((err: Error) => {
	log.error(err.message);
	process.exit(1);
});
