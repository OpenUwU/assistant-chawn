/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

export { closePool, query, queryOne } from "./pg.js";
export { closeRedis, getRedis } from "./redis.js";
export * from "./stores/access.js";

import { logger } from "../utils/logger.js";
import { hydrateAccess } from "./stores/access.js";

export async function hydrateAll(): Promise<void> {
	logger.info("[db] starting Redis hydration…");

	await Promise.all([hydrateAccess()]);

	logger.info("[db] Redis hydration complete");
}
