"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const blog_1 = require("../libs/blog");
const app = new hono_1.Hono();
app.get('/', async (c) => {
    try {
        const url = new URL(c.req.url);
        const page = Number(url.searchParams.get("page")) || 1;
        const per_page = Number(url.searchParams.get("per_page")) || 9;
        const search = url.searchParams.get("search") || "";
        const category = url.searchParams.get("category") || "";
        const categories = url.searchParams.get("categories");
        const is_featured = categories === "16" ? true : undefined;
        const data = (0, blog_1.getBlogs)({
            page,
            per_page,
            search,
            category,
            is_featured,
        });
        c.header('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
        return c.json({ status: true, data });
    }
    catch (error) {
        return c.json({ status: false, error }, 500);
    }
});
exports.default = app;
