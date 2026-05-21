"use client";

import { useEffect } from "react";

import type { GuestbookMessage } from "@/common/types/guestbook";

import { supabaseClient } from "@/common/libs/supabase-client";

interface RealtimeListenerProps {
	onRealtimeInsert: (message: GuestbookMessage) => void;
}

export const RealtimeListener = ({ onRealtimeInsert }: RealtimeListenerProps) => {
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
					onRealtimeInsert(payload.new as GuestbookMessage);
				},
			)
			.subscribe();

		return () => {
			supabaseClient.removeChannel(channel);
		};
	}, [onRealtimeInsert]);

	return null;
};
