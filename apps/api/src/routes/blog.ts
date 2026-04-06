import { Hono } from 'hono'
import { getBlogs } from '../libs/blog'

const app = new Hono()

app.get('/', async (c) => {
  try {
    const url = new URL(c.req.url)
    const page = Number(url.searchParams.get("page")) || 1;
    const per_page = Number(url.searchParams.get("per_page")) || 9;
    const search = url.searchParams.get("search") || "";
    const category = url.searchParams.get("category") || "";
    const categories = url.searchParams.get("categories");
    const is_featured = categories === "16" ? true : undefined;

    const data = getBlogs({
      page,
      per_page,
      search,
      category,
      is_featured,
    });

    c.header('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
    return c.json({ status: true, data });
  } catch (error) {
    return c.json({ status: false, error }, 500);
  }
})

export default app
