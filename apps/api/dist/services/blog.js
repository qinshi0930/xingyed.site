"use strict";
/**
 * @deprecated 此文件已废弃，blog 数据已迁移到本地 MDX 文件
 * 现在使用 /src/common/libs/blog.ts 中的函数读取本地数据
 * 保留此文件仅供参考，可在确认迁移完成后删除
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlogDetail = exports.getBlogList = void 0;
const axios_1 = __importDefault(require("axios"));
const BLOG_URL = process.env.BLOG_API_URL;
const handleAxiosError = (error) => {
    if (error?.response) {
        return { status: error?.response?.status, data: error?.response?.data };
    }
    else {
        return { status: 500, data: { message: "Internal Server Error" } };
    }
};
const extractData = (response) => {
    const { headers, data } = response;
    return {
        posts: data,
        page: response?.config?.params?.page || 1,
        per_page: response?.config?.params?.per_page || 6,
        total_pages: Number(headers["x-wp-totalpages"]) || 0,
        total_posts: Number(headers["x-wp-total"]) || 0,
        categories: response?.config?.params?.categories,
    };
};
const getBlogList = async ({ page = 1, per_page = 6, categories, search, }) => {
    try {
        const params = { page, per_page, categories, search };
        const response = await axios_1.default.get(`${BLOG_URL}posts`, { params });
        return { status: response?.status, data: extractData(response) };
    }
    catch (error) {
        return handleAxiosError(error);
    }
};
exports.getBlogList = getBlogList;
const getBlogDetail = async (id) => {
    try {
        const response = await axios_1.default.get(`${BLOG_URL}posts/${id}`);
        return { status: response?.status, data: response?.data };
    }
    catch (error) {
        return handleAxiosError(error);
    }
};
exports.getBlogDetail = getBlogDetail;
