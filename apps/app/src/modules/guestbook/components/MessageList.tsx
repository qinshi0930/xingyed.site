"use client";

import { useEffect, useState } from "react";

import type { GuestbookMessage } from "@/common/types/guestbook";

import { apiFetch } from "@/common/libs/api-fetch";

import { MessageItem } from "./MessageItem";

interface MessageListProps {
	onNewMessage: () => void;
}

interface ListResponse {
	items: GuestbookMessage[];
	total: number;
}

export const MessageList = ({ onNewMessage }: MessageListProps) => {
	const [messages, setMessages] = useState<GuestbookMessage[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadMessages();
	}, []);

	const loadMessages = async () => {
		try {
			// limit=100 覆盖当前活跃留言量；分页 UI 留作未来增强
			const result = await apiFetch<ListResponse>("/api/guestbook?limit=100");
			setMessages(result.items);
		} catch {
			// apiFetch 已统一弹 toast
		} finally {
			setLoading(false);
		}
	};

	const handleMessageUpdate = () => {
		loadMessages();
		onNewMessage();
	};

	const handleMessageDelete = () => {
		loadMessages();
		onNewMessage();
	};

	if (loading) {
		return <div className="text-center py-8">加载中...</div>;
	}

	if (messages.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				暂无留言，成为第一个留言的人吧！
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{messages.map((message) => (
				<MessageItem
					key={message.id}
					message={message}
					onUpdate={handleMessageUpdate}
					onDelete={handleMessageDelete}
				/>
			))}
		</div>
	);
};
