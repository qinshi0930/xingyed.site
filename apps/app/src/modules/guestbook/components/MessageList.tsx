"use client";

import { useEffect } from "react";
import { useIntersectionObserver } from "usehooks-ts";

import type { OptimisticGuestbookMessage } from "@/common/types/guestbook";

import { MessageItem } from "./MessageItem";
import { MessageItemSkeleton } from "./MessageItemSkeleton";

interface MessageListProps {
	messages: OptimisticGuestbookMessage[];
	isLoadingInitial: boolean;
	isLoadingMore: boolean;
	hasMore: boolean;
	loadMore: () => void;
	onUpdate: () => void;
	onDelete: (messageId: string) => void;
}

export const MessageList = ({
	messages,
	isLoadingInitial,
	isLoadingMore,
	hasMore,
	loadMore,
	onUpdate,
	onDelete,
}: MessageListProps) => {
	const { ref: sentinelRef, isIntersecting } = useIntersectionObserver({
		threshold: 0,
		rootMargin: "100px",
	});

	useEffect(() => {
		if (isIntersecting && hasMore && !isLoadingMore && !isLoadingInitial) {
			loadMore();
		}
	}, [isIntersecting, hasMore, isLoadingMore, isLoadingInitial, loadMore]);

	if (isLoadingInitial) {
		return (
			<div className="space-y-4">
				{Array.from({ length: 5 }).map((_, i) => (
					<MessageItemSkeleton key={i} />
				))}
			</div>
		);
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
					onUpdate={onUpdate}
					onDelete={() => onDelete(message.id)}
				/>
			))}

			{/* 加载更多骨架屏 */}
			{isLoadingMore && (
				<>
					<MessageItemSkeleton />
					<MessageItemSkeleton />
				</>
			)}

			{/* Sentinel div for Intersection Observer */}
			{hasMore && !isLoadingMore && (
				<div
					ref={sentinelRef as React.RefCallback<HTMLDivElement>}
					className="h-1"
					aria-hidden="true"
				/>
			)}
		</div>
	);
};
