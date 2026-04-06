import type { BlogItemProps } from "@repo/types";
interface GetBlogsParams {
    page?: number;
    per_page?: number;
    search?: string;
    category?: string;
    is_featured?: boolean;
}
export declare const loadBlogFiles: () => BlogItemProps[];
export declare const getBlogBySlug: (slug: string) => BlogItemProps | undefined;
export declare const getBlogById: (id: number) => BlogItemProps | undefined;
export declare const getBlogs: ({ page, per_page, search, category, is_featured, }: GetBlogsParams) => {
    posts: BlogItemProps[];
    page: number;
    per_page: number;
    total_pages: number;
    total_posts: number;
};
export {};
