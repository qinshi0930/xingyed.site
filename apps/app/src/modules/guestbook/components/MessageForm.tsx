"use client";

import type { ChangeEvent } from "react";

import { GithubIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { ApiResponse } from "@/common/types/guestbook";

import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/shadcn/ui/avatar";
import { Button } from "@/common/components/shadcn/ui/button";
import { Skeleton } from "@/common/components/shadcn/ui/skeleton";
import { Textarea } from "@/common/components/shadcn/ui/textarea";
import { signIn, useSession } from "@/common/libs/auth-client";

export const MessageForm = () => {
	const { data: session, isPending } = useSession();
	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoggingIn, setIsLoggingIn] = useState(false);

	// 检测登录错误
	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search);
		const loginFailed = searchParams.get("login");

		if (loginFailed === "failed" && !session) {
			toast.error("未完成登录，请重试");

			// 清除 URL 参数
			window.history.replaceState({}, "", "/guestbook");
		}
	}, [session]);

	const handleSubmit = async () => {
		if (!message.trim()) return;

		setIsSubmitting(true);
		try {
			const response = await fetch("/api/guestbook", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: message.trim() }),
			});

			const result: ApiResponse = await response.json();

			if (!result.success) {
				toast.error(result.error || "提交失败");
				return;
			}

			toast.success("留言成功！");
			setMessage("");
		} catch {
			toast.error("网络错误，请稍后重试");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleLogin = async () => {
		setIsLoggingIn(true);
		try {
			// 先检查 OAuth 配置
			const response = await fetch("/api/auth/github/status");
			const data = await response.json();

			if (!data.enabled) {
				toast.error("登录功能暂时不可用");
				return;
			}

			// 配置正常，执行跳转
			signIn.social({
				provider: "github",
				callbackURL: "/guestbook",
			});
		} catch {
			toast.error("网络错误，请稍后重试");
		} finally {
			setIsLoggingIn(false);
		}
	};

	return (
		<div className="space-y-4">
			<Textarea
				value={message}
				onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
				placeholder={
					isPending ? "加载中..." : session ? "写下你的留言..." : "登录后即可留言"
				}
				disabled={!session || isPending}
				className={!session || isPending ? "bg-muted cursor-not-allowed" : ""}
				rows={4}
			/>

			<div className="flex items-center justify-between">
				{isPending ? (
					<div className="flex items-center gap-2">
						<Skeleton className="h-8 w-8 rounded-full" />
						<Skeleton className="h-4 w-24" />
					</div>
				) : session ? (
					<div className="flex items-center gap-2">
						<Avatar className="h-8 w-8">
							<AvatarImage
								src={session.user.image || ""}
								alt={session.user.name || ""}
							/>
							<AvatarFallback>{session.user.name?.charAt(0)}</AvatarFallback>
						</Avatar>
						<span className="text-sm text-muted-foreground">
							@{session.user.username || session.user.name}
						</span>
					</div>
				) : (
					<div className="flex items-center gap-2">
						<Avatar className="h-8 w-8">
							<AvatarFallback className="bg-muted">?</AvatarFallback>
						</Avatar>
						<span className="text-sm text-muted-foreground">未登录用户</span>
					</div>
				)}

				{isPending ? (
					<Skeleton>
						<Button disabled variant="ghost">
							<span className="opacity-0">登录中...</span>
						</Button>
					</Skeleton>
				) : session ? (
					<Button onClick={handleSubmit} disabled={!message.trim() || isSubmitting}>
						{isSubmitting ? "提交中..." : "提交留言"}
					</Button>
				) : (
					<Button onClick={handleLogin} disabled={isLoggingIn}>
						<GithubIcon className="mr-2 h-4 w-4" />
						{isLoggingIn ? "登录中..." : "使用 GitHub 登录"}
					</Button>
				)}
			</div>
		</div>
	);
};
