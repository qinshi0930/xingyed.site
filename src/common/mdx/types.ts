export interface Frontmatter extends Record<string, unknown> {
	title: string;
	author: string;
	date: Date;
	summary: string;
}

export interface Scope extends Record<string, unknown> {
	readingTime: string;
	props?: {
		foo: string;
	};
}
