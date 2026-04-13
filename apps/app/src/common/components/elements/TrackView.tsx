"use client";

import { useEffect } from "react";

interface TrackViewProps {
	slug: string;
}

/**
 * 客户端组件：在页面加载时发送浏览量统计请求到 API
 * 这样避免了在服务端渲染时直接连接 Redis
 */
export default function TrackView({ slug }: TrackViewProps) {
	useEffect(() => {
		// 页面加载完成后，发送 POST 请求到 API 路由统计浏览量
		const trackView = async () => {
			try {
				await fetch(`/api/views?slug=${encodeURIComponent(slug)}`, {
					method: "POST",
				});
			} catch (error) {
				// 静默失败，不影响用户体验
				console.error("Failed to track view:", error);
			}
		};

		trackView();
	}, [slug]);

	// 这个组件不渲染任何内容
	return null;
}
