/**
 * Credits: The OpenUwU Project
 * Author:  @bre4d777 and collaborators
 * Project: Assistant Chawn
 * github.com/openUwU/assistant-chawn
 */

declare module "@sourcebin/linguist" {
	export interface SourcebinLinguistItem {
		name: string;
		color: string;
		extension: string;
		aliases?: string[];
		aceMode: string;
	}

	export const linguist: Record<string, SourcebinLinguistItem>;
	export const languages: Record<string, number>;
}
