"use client";

import { useCallback, useState } from "react";

import type { InitialSession } from "./context/InitialSessionContext";

import { MessageForm } from "./components/MessageForm";
import { MessageList } from "./components/MessageList";
import { RealtimeListener } from "./components/RealtimeListener";
import { InitialSessionProvider } from "./context/InitialSessionContext";

interface GuestbookProps {
	initialSession: InitialSession;
}

const Guestbook = ({ initialSession }: GuestbookProps) => {
	const [refreshKey, setRefreshKey] = useState(0);

	const handleNewMessage = useCallback(() => {
		setRefreshKey((prev) => prev + 1);
	}, []);

	return (
		<InitialSessionProvider value={initialSession}>
			<div className="space-y-8">
				<div>
					<h1 className="text-3xl font-bold mb-2">留言板</h1>
					<p className="text-muted-foreground">登录后即可留言，与其他访客交流</p>
				</div>

				<MessageForm />

				<RealtimeListener onNewMessage={handleNewMessage} />

				<MessageList key={refreshKey} onNewMessage={handleNewMessage} />
			</div>
		</InitialSessionProvider>
	);
};

export default Guestbook;
