"use client";
import { useEffect, useRef, useState } from "react";

import type { ChatListProps } from "@/common/types/chat";

import ChatItem from "./ChatItem";

interface ChatListPropsNew extends ChatListProps {
	isWidget?: boolean;
	onDeleteMessage: (id: string) => void;
}

const ChatList = ({ messages, isWidget = false, onDeleteMessage }: ChatListPropsNew) => {
	const chatListRef = useRef<HTMLDivElement | null>(null);
	const [hasScrolledUp, setHasScrolledUp] = useState(false);
	const [chatListHeight, setChatListHeight] = useState("500px");

	useEffect(() => {
		const handleScroll = () => {
			if (chatListRef.current) {
				const isScrolledToBottom =
					chatListRef.current.scrollHeight - chatListRef.current.clientHeight <=
					chatListRef.current.scrollTop + 5;

				if (isScrolledToBottom) {
					setHasScrolledUp(false);
				} else {
					setHasScrolledUp(true);
				}
			}
		};

		const currentChatListRef = chatListRef.current;
		currentChatListRef?.addEventListener("scroll", handleScroll);

		return () => {
			currentChatListRef?.removeEventListener("scroll", handleScroll);
		};
	}, []);

	useEffect(() => {
		if (chatListRef.current && !hasScrolledUp) {
			chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
		}
	}, [messages, hasScrolledUp]);

	useEffect(() => {
		const handleResize = () => {
			const newHeight = isWidget ? "500px" : `${window.innerHeight - 360}px`;
			// eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
			setChatListHeight(newHeight);
		};

		handleResize();

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, [isWidget]);

	return (
		<div className="rounded-lg px-1">
			<div
				ref={chatListRef}
				className="space-y-5 overflow-y-auto py-4"
				style={{ height: chatListHeight }}
			>
				{messages?.map((chat, index) => (
					// eslint-disable-next-line react/no-array-index-key
					<ChatItem key={index} onDelete={onDeleteMessage} {...chat} />
				))}
			</div>
		</div>
	);
};

export default ChatList;
