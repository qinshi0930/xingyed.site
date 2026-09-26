import type { TocItem } from "remark-flexible-toc";

export interface UserProps {
	name: string;
	username: string;
	twitter_username: string;
	github_username: string;
	user_id: number;
	website_url: string;
	profile_image: string;
	profile_image_90: string;
}

export interface BlogItemProps {
	id: number;
	date: string;
	modified: string;
	slug: string;
	status: string;
	link: string;
	title: {
		rendered: string;
	};
	content: {
		rendered: string;
		markdown: string;
		protected: boolean;
	};
	excerpt: {
		rendered: string;
		protected: boolean;
	};
	author: number;
	featured_media: number;
	comment_status: string;
	ping_status: string;
	sticky: boolean;
	template: string;
	format: string;
	meta: {
		footnotes: string;
	};
	categories: string[]; // 修改为字符串数组
	tags: string[]; // 修改为字符串数组
	tags_list: {
		term_id: number;
		name: string;
		slug: string;
		term_group: number;
		term_taxonomy_id: number;
		taxonomy: string;
		description: string;
		parent: number;
		count: number;
		filter: string;
	}[];
	amp_enabled: boolean;
	featured_image_url: string;
	is_featured: boolean; // 新增字段
	total_views_count: number;
}

export interface BlogDetailProps {
	id: number;
	/** 服务端从 markdown 抽取的目录（extractToc），由页面作为 prop 传入 */
	toc?: TocItem[];
	date: string;
	date_gmt?: string;
	modified: string;
	modified_gmt?: string;
	slug: string;
	status: string;
	type?: string;
	link: string;
	title: {
		rendered: string;
	};
	content: {
		rendered: string;
		markdown: string;
		protected: boolean;
	};
	excerpt: {
		rendered: string;
		protected: boolean;
	};
	author: number;
	featured_media: number;
	comment_status: string;
	ping_status: string;
	sticky: boolean;
	template: string;
	format: string;
	meta: {
		footnotes: string;
	};
	categories: string[]; // 修改为字符串数组
	tags: string[]; // 修改为字符串数组
	tags_list?: {
		term_id: number;
		name: string;
		slug: string;
		term_group: number;
		term_taxonomy_id: number;
		taxonomy: string;
		description: string;
		parent: number;
		count: number;
		filter: string;
	}[];
	amp_enabled: boolean;
	featured_image_url: string;
	is_featured: boolean; // 新增字段
	guid?: {
		rendered: string;
	};
	replies?: {
		embeddable: true;
		href: string;
	};
	version_history?: {
		count: number;
		href: string;
	};
	predecessor_version?: {
		id: number;
		href: string;
	};
	wp_featuredmedia?: {
		embeddable: true;
		href: string;
	};
	wp_attachment?: {
		href: string;
	};
	wp_term?: {
		taxonomy: string;
		embeddable: true;
		href: string;
	}[];
	curies?: {
		name: string;
		href: string;
		templated: true;
	}[];
	total_views_count: number;
}

export interface BlogProps {
	blogs: BlogItemProps[];
}

export interface BlogFeaturedProps {
	data: BlogItemProps[];
}
