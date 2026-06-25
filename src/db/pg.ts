/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import pg from "pg";
import { logger } from "../utils/logger.js";

const { Pool } = pg;

let _pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
	if (_pool) return _pool;

	const url = process.env.DATABASE_URL;
	if (!url) throw new Error("DATABASE_URL is not set.");

	_pool = new Pool({ connectionString: url, max: 10 });

	_pool.on("error", (err) => {
		logger.error(`[pg] idle client error: ${err.message}`);
	});

	_pool.on("connect", () => {
		logger.debug("[pg] new client connected");
	});

	return _pool;
}

export async function query<R extends pg.QueryResultRow = pg.QueryResultRow>(
	sql: string,
	values?: unknown[],
): Promise<R[]> {
	const result = await getPool().query<R>(sql, values);
	return result.rows;
}

export async function queryOne<R extends pg.QueryResultRow = pg.QueryResultRow>(
	sql: string,
	values?: unknown[],
): Promise<R | null> {
	const rows = await query<R>(sql, values);
	return rows[0] ?? null;
}

export async function closePool(): Promise<void> {
	if (!_pool) return;
	await _pool.end();
	_pool = null;
	logger.info("[pg] pool closed");
}
