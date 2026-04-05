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
    categories: string[];
    tags: string[];
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
    is_featured: boolean;
    total_views_count: number;
}
//# sourceMappingURL=blog.d.ts.map