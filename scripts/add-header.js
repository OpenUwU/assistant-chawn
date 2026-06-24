#!/usr/bin/env node
/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

import fs from "node:fs";
import path from "node:path";

const HEADER = `/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */
`;

const MARKER = "The OpenUwU Project";

function getAllTsFiles(dir, results = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (
			entry.name === "node_modules" ||
			entry.name === "dist" ||
			entry.name.startsWith(".")
		)
			continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) getAllTsFiles(full, results);
		else if (entry.name.endsWith(".ts") || entry.name.endsWith(".js"))
			results.push(full);
	}
	return results;
}

const args = process.argv.slice(2);
const files = args.length ? args : getAllTsFiles(".");

let changed = 0;
for (const file of files) {
	if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
	if (!fs.existsSync(file)) continue;

	const content = fs.readFileSync(file, "utf8");
	if (content.includes(MARKER)) continue;

	fs.writeFileSync(file, `${HEADER} \n ${content}`);
	console.log(`Added header to ${file}`);
	changed++;
}

if (changed === 0) console.log("No files needed a header.");
