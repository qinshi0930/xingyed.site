"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { supabaseClient } from "@/common/libs/supabase-client";

interface RealtimeListenerProps {
	onNewMessage: () => void;
}

export const RealtimeListener = ({ onNewMessage }: RealtimeListenerProps) => {
	useEffect(() => {
		const channel = supabaseClient
			.channel("guestbook-changes")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "guestbook_messages",
				},
				(payload) => {
					console.log("New message received:", payload);
					toast.info("收到新留言！");
					onNewMessage();
				},
			)
			.subscribe();

		return () => {
			supabaseClient.removeChannel(channel);
		};
	}, [onNewMessage]);

	return null;
};
