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
