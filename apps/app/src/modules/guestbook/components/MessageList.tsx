"use client";

import { useEffect, useState } from "react";

import type { GuestbookMessage } from "@/common/types/guestbook";

import { supabaseClient } from "@/common/libs/supabase-client";

import { MessageItem } from "./MessageItem";

interface MessageListProps {
	onNewMessage: () => void;
}

export const MessageList = ({ onNewMessage }: MessageListProps) => {
	const [messages, setMessages] = useState<GuestbookMessage[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadMessages();
	}, []);

	const loadMessages = async () => {
		try {
			const { data, error } = await supabaseClient
				.from("guestbook_messages")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;
			setMessages(data || []);
		} catch (error) {
			console.error("Failed to load messages:", error);
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
