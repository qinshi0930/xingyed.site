"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { GuestbookMessage, OptimisticGuestbookMessage } from "@/common/types/guestbook";

import { apiFetch } from "@/common/libs/api-fetch";

import type { InitialSession } from "./context/InitialSessionContext";

import { MessageForm } from "./components/MessageForm";
import { MessageList } from "./components/MessageList";
import { RealtimeListener } from "./components/RealtimeListener";
import { InitialSessionProvider } from "./context/InitialSessionContext";

const PAGE_SIZE = 20;

interface ListResponse {
	items: GuestbookMessage[];
	total: number;
}

interface GuestbookProps {
	initialSession: InitialSession;
}

const Guestbook = ({ initialSession }: GuestbookProps) => {
	const [messages, setMessages] = useState<OptimisticGuestbookMessage[]>([]);
	const [total, setTotal] = useState(0);
	const [isLoadingInitial, setIsLoadingInitial] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	const hasMore = messages.filter((m) => !m._optimistic).length < total;

	// 用 ref 跟踪是否已初始化加载，避免 StrictMode 双次调用
	const initializedRef = useRef(false);

	useEffect(() => {
		if (initializedRef.current) return;
		initializedRef.current = true;
		loadMessages(0);
	}, []);

	const loadMessages = async (offset: number) => {
		try {
			const result = await apiFetch<ListResponse>(
				`/api/guestbook?limit=${PAGE_SIZE}&offset=${offset}`,
			);
			if (offset === 0) {
				setMessages(result.items);
			} else {
				setMessages((prev) => [...prev, ...result.items]);
			}
			setTotal(result.total);
		} catch {
			// apiFetch 已统一弹 toast
		} finally {
			setIsLoadingInitial(false);
			setIsLoadingMore(false);
		}
	};

	const loadMore = useCallback(() => {
		if (isLoadingMore) return;
		setIsLoadingMore(true);
		const currentRealCount = messages.filter((m) => !m._optimistic).length;
		loadMessages(currentRealCount);
	}, [isLoadingMore, messages]);

	// --- Optimistic Update ---

	const handleOptimisticAdd = useCallback((tempMsg: OptimisticGuestbookMessage) => {
		setMessages((prev) => [tempMsg, ...prev]);
	}, []);

	const handleOptimisticConfirm = useCallback((tempId: string, realMsg: GuestbookMessage) => {
		setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...realMsg } : m)));
		setTotal((prev) => prev + 1);
	}, []);

	const handleOptimisticRevert = useCallback((tempId: string) => {
		setMessages((prev) => prev.filter((m) => m.id !== tempId));
	}, []);

	// --- Realtime ---

	const handleRealtimeInsert = useCallback((newMsg: GuestbookMessage) => {
		setMessages((prev) => {
			// 去重：如果该消息已存在（optimistic confirm 后），忽略
			if (prev.some((m) => m.id === newMsg.id)) return prev;
			toast.info("收到新留言！");
			return [newMsg, ...prev];
		});
		setTotal((prev) => prev + 1);
	}, []);

	// --- 编辑/删除后刷新 ---

	const handleMessageUpdate = useCallback(() => {
		// 重新加载当前已展示的全部消息
		const realCount = messages.filter((m) => !m._optimistic).length;
		loadMessages(0).then(() => {
			// 加载第一页后如果之前加载了更多，需要补充
			if (realCount > PAGE_SIZE) {
				// 简化处理：只重载第一页的量即可，用户可以继续滚动加载
			}
		});
	}, [messages]);

	const handleMessageDelete = useCallback(() => {
		setTotal((prev) => prev - 1);
		// 删除已在 MessageItem 的 onDelete 中从列表移除
	}, []);

	return (
		<InitialSessionProvider value={initialSession}>
			<div className="space-y-8">
				<div>
					<h1 className="text-3xl font-bold mb-2">留言板</h1>
					<p className="text-muted-foreground">登录后即可留言，与其他访客交流</p>
				</div>

				<MessageForm
					onOptimisticAdd={handleOptimisticAdd}
					onOptimisticConfirm={handleOptimisticConfirm}
					onOptimisticRevert={handleOptimisticRevert}
				/>

				<RealtimeListener onRealtimeInsert={handleRealtimeInsert} />

				<MessageList
					messages={messages}
					isLoadingInitial={isLoadingInitial}
					isLoadingMore={isLoadingMore}
					hasMore={hasMore}
					loadMore={loadMore}
					onUpdate={handleMessageUpdate}
					onDelete={handleMessageDelete}
				/>
			</div>
		</InitialSessionProvider>
	);
};

export default Guestbook;
