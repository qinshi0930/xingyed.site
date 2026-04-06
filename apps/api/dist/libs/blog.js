"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlogs = exports.getBlogById = exports.getBlogBySlug = exports.loadBlogFiles = void 0;
const gray_matter_1 = __importDefault(require("gray-matter"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const loadBlogFiles = () => {
    const dirPath = node_path_1.default.join(process.cwd(), "src", "contents", "blog");
    if (!node_fs_1.default.existsSync(dirPath)) {
        return [];
    }
    const files = node_fs_1.default.readdirSync(dirPath).filter((f) => f.endsWith(".mdx"));
    const blogs = files.map((file) => {
        try {
            const filePath = node_path_1.default.join(dirPath, file);
            const source = node_fs_1.default.readFileSync(filePath, "utf-8");
            const { content, data } = (0, gray_matter_1.default)(source);
            return {
                id: data.id,
                slug: data.slug || file.replace(".mdx", ""),
                title: { rendered: data.title },
                content: {
                    rendered: content,
                    markdown: content,
                    protected: false,
                },
                excerpt: { rendered: data.excerpt, protected: false },
                date: data.date,
                modified: data.date,
                featured_image_url: data.featured_image,
                categories: data.categories || [],
                tags: data.tags || [],
                is_featured: data.is_featured || false,
                total_views_count: data.total_views_count || 0,
                status: "publish",
                link: `/blog/${data.slug}?id=${data.id}`,
                author: 1,
                featured_media: 0,
                comment_status: "open",
                ping_status: "open",
                sticky: false,
                template: "",
                format: "standard",
                meta: { footnotes: "" },
                tags_list: [],
                amp_enabled: false,
            };
        }
        catch (error) {
            console.error(`Error processing MDX file "${file}":`, error);
            throw error;
        }
    });
    // 按日期排序（最新的在前）
    return blogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
exports.loadBlogFiles = loadBlogFiles;
const getBlogBySlug = (slug) => {
    const blogs = (0, exports.loadBlogFiles)();
    return blogs.find((blog) => blog.slug === slug);
};
exports.getBlogBySlug = getBlogBySlug;
const getBlogById = (id) => {
    const blogs = (0, exports.loadBlogFiles)();
    return blogs.find((blog) => blog.id === id);
};
exports.getBlogById = getBlogById;
const getBlogs = ({ page = 1, per_page = 6, search = "", category = "", is_featured = undefined, }) => {
    let blogs = (0, exports.loadBlogFiles)();
    // 分类筛选
    if (category) {
        blogs = blogs.filter((blog) => blog.categories.includes(category));
    }
    // Featured 筛选
    if (is_featured !== undefined) {
        blogs = blogs.filter((blog) => blog.is_featured === is_featured);
    }
    // 搜索功能
    if (search) {
        const searchLower = search.toLowerCase();
        blogs = blogs.filter((blog) => blog.title.rendered.toLowerCase().includes(searchLower) ||
            blog.excerpt.rendered.toLowerCase().includes(searchLower) ||
            blog.tags.some((tag) => tag.toLowerCase().includes(searchLower)));
    }
    const total_posts = blogs.length;
    const total_pages = Math.ceil(total_posts / per_page);
    // 分页
    const start = (page - 1) * per_page;
    const paginatedBlogs = blogs.slice(start, start + per_page);
    return {
        posts: paginatedBlogs,
        page,
        per_page,
        total_pages,
        total_posts,
    };
};
exports.getBlogs = getBlogs;
