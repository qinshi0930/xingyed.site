"use client";

import type { ChangeEvent } from "react";

import { GithubIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { GuestbookMessage, OptimisticGuestbookMessage } from "@/common/types/guestbook";

import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/shadcn/ui/avatar";
import { Button } from "@/common/components/shadcn/ui/button";
import { Skeleton } from "@/common/components/shadcn/ui/skeleton";
import { Textarea } from "@/common/components/shadcn/ui/textarea";
import { apiFetch } from "@/common/libs/api-fetch";
import { signIn, useSession } from "@/common/libs/auth-client";

import { useInitialSession } from "../context/InitialSessionContext";

interface MessageFormProps {
	onOptimisticAdd: (msg: OptimisticGuestbookMessage) => void;
	onOptimisticConfirm: (tempId: string, realMsg: GuestbookMessage) => void;
	onOptimisticRevert: (tempId: string) => void;
}

export const MessageForm = ({
	onOptimisticAdd,
	onOptimisticConfirm,
	onOptimisticRevert,
}: MessageFormProps) => {
	const { data: session, isPending } = useSession();
	const initialSession = useInitialSession();

	// 渲染层 fallback：SSR 预取有值时直接使用，消除首帧 isPending=true 带来的闪烁
	// 注意：useEffect 依赖仍使用 session（实时态），仅 JSX 渲染在 displaySession/displayPending 上做降级
	const displaySession = session ?? initialSession;
	const displayPending = isPending && !initialSession;
	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoggingIn, setIsLoggingIn] = useState(false);

	// 登录成功后重置 loading 状态（处理 signIn.social 与 useSession 的 race condition）
	useEffect(() => {
		if (session && isLoggingIn) {
			setIsLoggingIn(false);
		}
	}, [session, isLoggingIn]);

	// 兜底重置 isLoggingIn：用户从 GitHub 取消授权返回（bfcache）/ 切回 tab / 长时间无响应
	// 解决 issue #53：handleLogin 触发外部跳转后，若用户中止流程，单纯靠 catch / session 副作用无法恢复 loading 状态
	useEffect(() => {
		if (!isLoggingIn) return;

		const reset = () => setIsLoggingIn(false);
		let visibilityTimeout: number | undefined;

		// 1. 浏览器 bfcache 命中（用户在 GitHub 点取消 / 后退按钮）—— 立即重置
		const onPageShow = (event: PageTransitionEvent) => {
			if (event.persisted) reset();
		};

		// 2. 标签页可见性切换（用户切回 /guestbook）—— 给 useSession 1.5s 拉取窗口后再重置
		const onVisibility = () => {
			if (document.visibilityState !== "visible") return;
			if (visibilityTimeout) window.clearTimeout(visibilityTimeout);
			visibilityTimeout = window.setTimeout(() => {
				// 函数式 setState 保证读到最新值；session 进入后另一 useEffect 已将其置 false
				setIsLoggingIn((current) => (current ? false : current));
			}, 1500);
		};

		// 3. 30 秒超时兜底，覆盖任何遗漏路径
		const timeoutId = window.setTimeout(reset, 30_000);

		window.addEventListener("pageshow", onPageShow);
		document.addEventListener("visibilitychange", onVisibility);

		return () => {
			window.removeEventListener("pageshow", onPageShow);
			document.removeEventListener("visibilitychange", onVisibility);
			window.clearTimeout(timeoutId);
			if (visibilityTimeout) window.clearTimeout(visibilityTimeout);
		};
	}, [isLoggingIn]);

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
		if (!message.trim() || !displaySession) return;

		const tempId = crypto.randomUUID();
		const tempMsg: OptimisticGuestbookMessage = {
			id: tempId,
			user_id: displaySession.user.id,
			user_name: displaySession.user.name || "User",
			user_image: displaySession.user.image || undefined,
			github_username: displaySession.user.username || displaySession.user.name || "unknown",
			content: message.trim(),
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			_optimistic: true,
		};

		onOptimisticAdd(tempMsg);
		setMessage("");
		setIsSubmitting(true);

		try {
			const realMsg = await apiFetch<GuestbookMessage>("/api/guestbook", {
				method: "POST",
				body: JSON.stringify({ message: tempMsg.content }),
				defaultErrorMessage: "提交失败",
			});
			onOptimisticConfirm(tempId, realMsg);
			toast.success("留言成功！");
		} catch {
			onOptimisticRevert(tempId);
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
				setIsLoggingIn(false);
				return;
			}

			// 配置正常，执行跳转
			// 注意：登录成功后不立即重置 isLoggingIn，等待 useSession 检测到 session 更新
			// errorCallbackURL：OAuth 失败（用户取消授权 / token 交换失败 / state 校验失败）时跳回 /guestbook?login=failed触发 toast 提示
			await signIn.social({
				provider: "github",
				callbackURL: "/guestbook",
				errorCallbackURL: "/guestbook?login=failed",
			});
		} catch {
			toast.error("网络错误，请稍后重试");
			setIsLoggingIn(false);
		}
	};

	return (
		<div className="space-y-4">
			<Textarea
				value={message}
				onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
				placeholder={
					displayPending
						? "加载中..."
						: displaySession
							? "写下你的留言..."
							: "登录后即可留言"
				}
				disabled={!displaySession || displayPending}
				className={!displaySession || displayPending ? "bg-muted cursor-not-allowed" : ""}
				rows={4}
			/>

			<div className="flex items-center justify-between">
				{displayPending ? (
					<div className="flex items-center gap-2">
						<Skeleton className="h-8 w-8 rounded-full" />
						<Skeleton className="h-4 w-24" />
					</div>
				) : displaySession ? (
					<div className="flex items-center gap-2">
						<Avatar className="h-8 w-8">
							<AvatarImage
								src={displaySession.user.image || ""}
								alt={displaySession.user.name || ""}
							/>
							<AvatarFallback>{displaySession.user.name?.charAt(0)}</AvatarFallback>
						</Avatar>
						<span className="text-sm text-muted-foreground">
							@{displaySession.user.username || displaySession.user.name}
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

				{displayPending ? (
					<Skeleton>
						<Button disabled variant="ghost">
							<span className="opacity-0">登录中...</span>
						</Button>
					</Skeleton>
				) : displaySession ? (
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
