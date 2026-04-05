"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlogViews = exports.getBlogComment = exports.getBlogDetail = exports.getBlogData = void 0;
const axios_1 = __importDefault(require("axios"));
const BASE_URL = "https://dev.to/api/";
const BLOG_URL = `${BASE_URL}articles/`;
const COMMENT_URL = `${BASE_URL}comments`;
const USERNAME = "aulianza";
const DEVTO_KEY = process.env.DEVTO_KEY;
const getBlogData = async ({ page = 1, per_page = 6, }) => {
    const params = new URLSearchParams({
        username: USERNAME,
        page: page.toString(),
        per_page: per_page.toString(),
    });
    const response = await axios_1.default.get(`${BLOG_URL}me?${params.toString()}`, {
        headers: {
            "api-key": DEVTO_KEY,
        },
    });
    const status = response?.status;
    if (status >= 400) {
        return { status, data: {} };
    }
    const getData = response.data;
    const data = {
        posts: getData,
        page,
        per_page,
        has_next: getData?.length === per_page,
    };
    return {
        status,
        data,
    };
};
exports.getBlogData = getBlogData;
const getBlogDetail = async ({ id, }) => {
    const params = new URLSearchParams({ username: USERNAME });
    const response = await axios_1.default.get(`${BLOG_URL}/${id}?${params.toString()}`, {
        headers: {
            "api-key": DEVTO_KEY,
        },
    });
    const status = response?.status;
    if (status >= 400) {
        return { status, data: {} };
    }
    const data = response.data;
    return {
        status,
        data,
    };
};
exports.getBlogDetail = getBlogDetail;
const getBlogComment = async ({ post_id, }) => {
    const response = await axios_1.default.get(`${COMMENT_URL}/?a_id=${post_id}`, {
        headers: {
            "api-key": DEVTO_KEY,
        },
    });
    const status = response?.status;
    if (status >= 400) {
        return { status, data: {} };
    }
    const data = response.data;
    return {
        status,
        data,
    };
};
exports.getBlogComment = getBlogComment;
const getBlogViews = async ({ id, }) => {
    const response = await axios_1.default.get(`${BLOG_URL}me/all`, {
        headers: {
            "api-key": DEVTO_KEY,
        },
    });
    const status = response?.status;
    if (status >= 400) {
        return { status, data: {} };
    }
    const data = response.data;
    const findArticle = data?.find((blog) => blog.id === id);
    const page_views_count = findArticle?.page_views_count;
    return {
        status,
        data: {
            page_views_count,
        },
    };
};
exports.getBlogViews = getBlogViews;
