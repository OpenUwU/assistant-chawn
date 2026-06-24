/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

export class HttpError extends Error {
	public readonly status: number;

	constructor(status: number, message: string) {
		super(message);
		this.name = "HttpError";
		this.status = status;
	}
}

/**
 * Fetches JSON from a URL
 * aborting if the request takes longer than timeoutMs. Throws HttpError
 * on non-2xx responses so callers can branch on status
 */
export async function fetchJson<T>(url: string, timeoutMs = 6000): Promise<T> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const res = await fetch(url, { signal: controller.signal });
		if (!res.ok) {
			throw new HttpError(
				res.status,
				`Request to ${url} failed with status ${res.status}`,
			);
		}
		return (await res.json()) as T;
	} finally {
		clearTimeout(timer);
	}
}
