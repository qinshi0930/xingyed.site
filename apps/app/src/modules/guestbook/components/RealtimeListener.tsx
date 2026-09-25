"use client";

import { useEffect, useRef } from "react";

import type { GuestbookMessage } from "@/common/types/guestbook";

interface RealtimeListenerProps {
	onRealtimeInsert: (message: GuestbookMessage) => void;
	onTotalChange?: (total: number) => void;
}

const POLL_INTERVAL_MS = 30_000;

/**
 * 轮询式增量监听（替代 Supabase Realtime）。
 * 服务端不再依赖 Supabase，改为定期拉取最新一页，发现新留言时回调。
 */
export const RealtimeListener = ({ onRealtimeInsert, onTotalChange }: RealtimeListenerProps) => {
	const insertRef = useRef(onRealtimeInsert);
	const totalRef = useRef(onTotalChange);
	const seenIdsRef = useRef<Set<string> | null>(null);

	useEffect(() => {
		insertRef.current = onRealtimeInsert;
	}, [onRealtimeInsert]);

	useEffect(() => {
		totalRef.current = onTotalChange;
	}, [onTotalChange]);

	useEffect(() => {
		let cancelled = false;

		const tick = async () => {
			if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

			try {
				const response = await fetch("/api/guestbook?limit=20&offset=0", {
					cache: "no-store",
				});
				if (!response.ok) return;

				const payload = (await response.json()) as {
					data?: { items?: GuestbookMessage[]; total?: number };
				};
				const items = payload?.data?.items ?? [];

				if (cancelled) return;

				if (typeof payload?.data?.total === "number") {
					totalRef.current?.(payload.data.total);
				}

				// 首次仅建立基线，避免把页面已加载的内容误判为新留言
				if (seenIdsRef.current === null) {
					seenIdsRef.current = new Set(items.map((item) => item.id));
					return;
				}

				const seen = seenIdsRef.current;
				for (const item of [...items].reverse()) {
					if (seen.has(item.id)) continue;
					seen.add(item.id);
					insertRef.current(item);
				}
			} catch {
				// 静默失败，等待下一轮
			}
		};

		void tick();
		const timer = window.setInterval(tick, POLL_INTERVAL_MS);
		const handleVisibility = () => {
			if (document.visibilityState === "visible") void tick();
		};
		document.addEventListener("visibilitychange", handleVisibility);

		return () => {
			cancelled = true;
			window.clearInterval(timer);
			document.removeEventListener("visibilitychange", handleVisibility);
		};
	}, []);

	return null;
};
