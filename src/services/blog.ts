/**
 * @deprecated 此文件已废弃，blog 数据已迁移到本地 MDX 文件
 * 现在使用 /src/common/libs/blog.ts 中的函数读取本地数据
 * 保留此文件仅供参考，可在确认迁移完成后删除
 */

import type { AxiosError, AxiosResponse } from "axios";

import axios from "axios";

import type { BlogItemProps } from "@/common/types/blog";

interface BlogParamsProps {
	page?: number;
	per_page?: number;
	categories?: number | undefined;
	search?: string;
}

interface BlogDetailResponseProps {
	status: number;
	data: any;
}

const BLOG_URL = process.env.BLOG_API_URL as string;

const handleAxiosError = (error: AxiosError<any>): { status: number; data: any } => {
	if (error?.response) {
		return { status: error?.response?.status, data: error?.response?.data };
	} else {
		return { status: 500, data: { message: "Internal Server Error" } };
	}
};

const extractData = (
	response: AxiosResponse,
): {
	posts: BlogItemProps[];
	page: number;
	per_page: number;
	total_pages: number;
	total_posts: number;
	categories: number;
} => {
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

export const getBlogList = async ({
	page = 1,
	per_page = 6,
	categories,
	search,
}: BlogParamsProps): Promise<{ status: number; data: any }> => {
	try {
		const params = { page, per_page, categories, search };
		const response = await axios.get(`${BLOG_URL}posts`, { params });
		return { status: response?.status, data: extractData(response) };
	} catch (error) {
		return handleAxiosError(error as AxiosError<any>);
	}
};

export const getBlogDetail = async (id: number): Promise<BlogDetailResponseProps> => {
	try {
		const response = await axios.get(`${BLOG_URL}posts/${id}`);
		return { status: response?.status, data: response?.data };
	} catch (error) {
		return handleAxiosError(error as AxiosError<any>);
	}
};
