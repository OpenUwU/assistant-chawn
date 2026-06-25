/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import { Redis } from "ioredis";
import { logger } from "../utils/logger.js";

let _redis: Redis | null = null;

export function getRedis(): Redis {
	if (_redis) return _redis;

	const url = process.env.REDIS_URL;
	if (!url) throw new Error("REDIS_URL is not set.");

	_redis = new Redis(url, {
		maxRetriesPerRequest: 3,
		enableReadyCheck: true,
		lazyConnect: false,
	});

	_redis.on("error", (err: Error) => {
		logger.error(`[redis] error: ${err.message}`);
	});

	_redis.on("connect", () => {
		logger.info("[redis] connected");
	});

	_redis.on("reconnecting", () => {
		logger.warn("[redis] reconnecting…");
	});

	return _redis;
}

export async function closeRedis(): Promise<void> {
	if (!_redis) return;
	await _redis.quit();
	_redis = null;
	logger.info("[redis] connection closed");
}
