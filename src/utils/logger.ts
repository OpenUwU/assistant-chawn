type Level = "info" | "warn" | "error" | "debug";

const COLORS: Record<Level, string> = {
	debug: "\x1b[90m", // gray
	info: "\x1b[36m", // cyan
	warn: "\x1b[33m", // yellow
	error: "\x1b[31m", // red
};
const RESET = "\x1b[0m";

function ts(): string {
	return new Date().toISOString();
}

function write(level: Level, message: string): void {
	const color = COLORS[level];
	const prefix = `${color}[${ts()}] [${level.toUpperCase()}]${RESET}`;
	if (level === "error") console.error(prefix, message);
	else if (level === "warn") console.warn(prefix, message);
	else console.log(prefix, message);
}

export const logger = {
	info: (msg: string): void => write("info", msg),
	warn: (msg: string): void => write("warn", msg),
	error: (msg: string): void => write("error", msg),
	debug: (msg: string): void => {
		if (process.env.DEBUG === "true") write("debug", msg);
	},
};
