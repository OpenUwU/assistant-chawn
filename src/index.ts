/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import "dotenv/config";
import { Player } from "discolink";
import { ChannelType, type Client } from "discord.js";
import { ExtendedClient } from "./client.js";
import { closePool, closeRedis, hydrateAll } from "./db/index.js";
import { loadCommands } from "./handlers/commandHandler.js";
import { loadEvents } from "./handlers/eventHandler.js";
import { logger } from "./utils/logger.js";

export const client = new ExtendedClient();
const isNodeSecure = process.env.LAVALINK_SSL === "true";
const node = {
	name: "main",
	requestTimeout: 120_000,
	origin: `${isNodeSecure ? "https" : "http"}:${process.env.LAVALINK_HOST}:${process.env.LAVALINK_PORT}`,
	password: process.env.LAVALINK_AUTH ?? "",
};

export const player = new Player({
	nodes: [node],
	autoInit: true,
	async forwardVoiceUpdate(guildId, payload) {
		client.guilds.cache.get(guildId)?.shard.send(payload);
	},
});

async function sendQueueNotice(
	client: Client,
	rawID: unknown,
	message: string,
) {
	if (!rawID) return;

	const channel =
		client.channels.cache.get(rawID as string) ??
		(await client.channels.fetch(rawID as string).catch(() => null));

	if (channel?.type === ChannelType.GuildText) {
		await channel.send(message).catch(() => null);
	}
}

async function bootstrap(): Promise<void> {
	const token = process.env.DISCORD_TOKEN;
	if (!token) throw new Error("DISCORD_TOKEN is missing from .env");

	await hydrateAll();
	console.log(process.env.LAVALINK_HOST);
	console.log(process.env.LAVALINK_PORT);
	console.log(process.env.LAVALINK_AUTH);

	await loadCommands(client);
	await loadEvents(client);

	await client.login(token);

	player.on("nodeConnect", (node, reconnects) =>
		logger.info(`node ${node.name} connected with ${reconnects} reconnects`),
	);
	player.on("nodeError", (node, error) =>
		logger.error(`node ${node.name} error: ${error}`),
	);
	player.on("nodeDisconnect", (node, code) =>
		logger.error(`node ${node.name} disconnected with code ${code}`),
	);
	player.on("queueCreate", (queue) => {
		logger.info(`Queue created: ${queue.guildId}`);
	});
	player.on("trackStart", (queue, track) => {
		logger.info(`Track started: ${track.title}`);
		if (!queue.context?.textId) return;
		void sendQueueNotice(
			client,
			queue.context?.textId,
			`Now playing: ${track.title}`,
		);
	});
	player.on("queueFinish", (queue) => {
		logger.info(`Queue finished: ${queue.guildId}`);
		if (!queue.context?.textId) return;
		void sendQueueNotice(client, queue.context?.textId, "Queue finished");
	});
}

async function shutdown(signal: string): Promise<void> {
	logger.info(`Received ${signal}, shutting down…`);
	client.destroy();
	await Promise.allSettled([closePool(), closeRedis()]);
	process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

bootstrap().catch((err) => {
	logger.error(`Fatal error during bootstrap: ${err}`);
	process.exit(1);
});

process.on("unhandledRejection", (reason) => {
	logger.error(`Unhandled rejection: ${reason}`);
});
