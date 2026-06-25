/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import type pg from "pg";
import { logger } from "../utils/logger.js";
import { query, queryOne } from "./pg.js";
import { getRedis } from "./redis.js";

/**
 * Everything BaseStore needs to know about one table.
 *
 * Row    = raw Postgres row type  (snake_case, mirrors column names exactly)
 * Entity = domain object your app works with  (camelCase, computed fields ok)
 * PK     = the key of Row that is the primary key column
 *
 *  NOTE:
 *   - Redis is the ONLY read path after boot. Cache miss ≠ "go ask PG", it means
 *     the record does not exist. Call hydrate() at startup to warm the cache.
 *   - PG is the ONLY write path. Writes go to PG first, then Redis is updated.
 *   - hydrate() is the only place PG is read after boot (or explicit re-sync).
 */
export interface StoreConfig<
	Row extends pg.QueryResultRow,
	Entity,
	PK extends keyof Row,
> {
	/** Postgres table name. */
	table: string;

	/**
	 * Redis key prefix. The store uses ONE hash per table:
	 *   hashKey = `${keyPrefix}:hash`
	 *   field   = String(row[primaryKey])
	 */
	keyPrefix: string;

	/** Column name that uniquely identifies a row. */
	primaryKey: PK;

	/** Convert a raw PG row into your domain entity. */
	fromRow(row: Row): Entity;

	/**
	 * Build the upsert SQL + values array.
	 *
	 * NOTE: Use `ON CONFLICT (...) DO UPDATE SET ...` not `DO NOTHING`.
	 * `DO NOTHING` returns zero rows on conflict, which BaseStore treats as
	 * a hard error. If you intentionally want insert-only semantics, use
	 * `DO UPDATE SET <pk> = EXCLUDED.<pk>` (a no-op update) so RETURNING *
	 * always gives back the row.
	 *
	 * Must end with `RETURNING *`.
	 */
	buildUpsert(entity: Entity): [sql: string, values: unknown[]];

	/**
	 * Optional override for the SELECT used in hydrate().
	 * Defaults to `SELECT * FROM <table>`.
	 * Must return rows whose columns match Row exactly (same names, same order).
	 */
	hydrateQuery?: string;
}

export class BaseStore<
	Row extends pg.QueryResultRow,
	Entity,
	PK extends keyof Row,
> {
	/** The Redis hash key that holds every cached record for this store. */
	readonly hashKey: string;

	constructor(private readonly cfg: StoreConfig<Row, Entity, PK>) {
		this.hashKey = `${cfg.keyPrefix}:hash`;
	}

	private field(id: Row[PK]): string {
		return String(id);
	}

	private serialize(entity: Entity): string {
		return JSON.stringify(entity);
	}

	private deserialize(raw: string): Entity {
		return JSON.parse(raw) as Entity;
	}

	async get(id: Row[PK]): Promise<Entity | null> {
		const cached = await getRedis().hget(this.hashKey, this.field(id));
		if (cached === null) {
			logger.debug(`[${this.cfg.table}] cache miss: ${this.field(id)}`);
			return null;
		}
		logger.debug(`[${this.cfg.table}] cache hit: ${this.field(id)}`);
		return this.deserialize(cached);
	}

	async has(id: Row[PK]): Promise<boolean> {
		const exists = await getRedis().hexists(this.hashKey, this.field(id));
		logger.debug(
			`[${this.cfg.table}] cache ${exists === 1 ? "hit" : "miss"} (has): ${this.field(id)}`,
		);
		return exists === 1;
	}

	async getAll(): Promise<Entity[]> {
		const raw = await getRedis().hgetall(this.hashKey);
		if (!raw) {
			logger.debug(
				`[${this.cfg.table}] cache miss (getAll): hash empty or missing`,
			);
			return [];
		}
		const entities = Object.values(raw).map((v) => this.deserialize(v));
		logger.debug(
			`[${this.cfg.table}] cache hit (getAll): ${entities.length} record(s)`,
		);
		return entities;
	}

	/**
	 * Upsert an entity.
	 *
	 * Returns the entity as PG stored it (via RETURNING *).
	 * Throws if the SQL returns no row — this means your buildUpsert uses
	 * DO NOTHING and hit a conflict. Switch to DO UPDATE as described in StoreConfig.
	 */
	async set(entity: Entity): Promise<Entity> {
		const [sql, values] = this.cfg.buildUpsert(entity);

		const row = await queryOne<Row>(sql, values);
		if (!row) {
			throw new Error(
				`[${this.cfg.table}] upsert returned no row. ` +
					`If using ON CONFLICT DO NOTHING, switch to DO UPDATE SET <pk> = EXCLUDED.<pk> ` +
					`so RETURNING * always produces a row.`,
			);
		}

		const saved = this.cfg.fromRow(row);

		try {
			await getRedis().hset(
				this.hashKey,
				this.field(row[this.cfg.primaryKey]),
				this.serialize(saved),
			);
		} catch (err) {
			logger.warn(
				`[${this.cfg.table}] Redis write failed after PG upsert: ${(err as Error).message}`,
			);
		}

		return saved;
	}

	async delete(id: Row[PK]): Promise<void> {
		await query(
			`DELETE FROM ${this.cfg.table} WHERE ${String(this.cfg.primaryKey)} = $1`,
			[id],
		);

		try {
			await getRedis().hdel(this.hashKey, this.field(id));
		} catch (err) {
			logger.warn(
				`[${this.cfg.table}] Redis eviction failed after PG delete: ${(err as Error).message}`,
			);
		}
	}
	async hydrate(): Promise<Entity[]> {
		const sql = this.cfg.hydrateQuery ?? `SELECT * FROM ${this.cfg.table}`;
		const rows = await query<Row>(sql);

		logger.debug(
			`[${this.cfg.table}] hydrating ${rows.length} row(s) into Redis`,
		);

		const redis = getRedis();
		const tmpKey = `${this.hashKey}:tmp:${Date.now()}`;
		const pipeline = redis.pipeline();

		const entities: Entity[] = [];

		for (const row of rows) {
			const entity = this.cfg.fromRow(row);
			entities.push(entity);
			pipeline.hset(
				tmpKey,
				this.field(row[this.cfg.primaryKey]),
				this.serialize(entity),
			);
		}

		if (entities.length > 0) {
			pipeline.rename(tmpKey, this.hashKey);
		} else {
			// Table is empty: delete any stale hash so getAll() correctly returns [].
			pipeline.del(this.hashKey);
		}

		const results = await pipeline.exec();
		if (results) {
			for (const [err] of results) {
				if (err) throw err;
			}
		}

		logger.debug(`[${this.cfg.table}] hydration complete`);
		return entities;
	}
}
