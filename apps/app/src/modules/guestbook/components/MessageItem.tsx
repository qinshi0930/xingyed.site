/* eslint-disable no-alert -- 删除确认需要使用 confirm */
"use client";

import dayjs from "dayjs";
import { EditIcon, Loader2Icon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { ApiResponse, GuestbookMessage } from "@/common/types/guestbook";

import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/shadcn/ui/avatar";
import { Button } from "@/common/components/shadcn/ui/button";
import { Textarea } from "@/common/components/shadcn/ui/textarea";
import { useSession } from "@/common/libs/auth-client";

interface MessageItemProps {
	message: GuestbookMessage;
	onUpdate: () => void;
	onDelete: () => void;
}

export const MessageItem = ({ message, onUpdate, onDelete }: MessageItemProps) => {
	const { data: session } = useSession();
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(message.content);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const isOwner = session?.user?.id === message.user_id;

	const handleUpdate = async () => {
		if (!editContent.trim() || isUpdating) return;

		setIsUpdating(true);

		try {
			const response = await fetch(`/api/guestbook/${message.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: editContent.trim() }),
			});

			const result: ApiResponse = await response.json();

			if (!result.success) {
				toast.error(result.error || "更新失败");
				return;
			}

			toast.success("更新成功！");
			setIsEditing(false);
			onUpdate();
		} catch {
			toast.error("网络错误，请稍后重试");
		} finally {
			setIsUpdating(false);
		}
	};

	const handleDelete = async () => {
		const confirmed = window.confirm("确定要删除这条留言吗？");
		if (!confirmed) return;

		if (isDeleting) return;

		setIsDeleting(true);

		try {
			const response = await fetch(`/api/guestbook/${message.id}`, {
				method: "DELETE",
			});

			const result: ApiResponse = await response.json();

			if (!result.success) {
				toast.error(result.error || "删除失败");
				return;
			}

			toast.success("删除成功！");
			onDelete();
		} catch {
			toast.error("网络错误，请稍后重试");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="flex gap-3 p-4 border rounded-lg bg-card">
			<Avatar className="h-10 w-10">
				<AvatarImage src={message.user_image || ""} alt={message.user_name} />
				<AvatarFallback>{message.user_name.charAt(0)}</AvatarFallback>
			</Avatar>

			<div className="flex-1 space-y-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="font-medium">@{message.github_username}</span>
						<span className="text-xs text-muted-foreground">
							{dayjs(message.created_at).format("YYYY-MM-DD HH:mm")}
						</span>
					</div>

					{isOwner && !isEditing && (
						<div className="flex gap-1">
							<Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
								<EditIcon className="h-4 w-4" />
							</Button>
							<Button variant="ghost" size="sm" onClick={handleDelete}>
								<TrashIcon className="h-4 w-4" />
							</Button>
						</div>
					)}
				</div>

				{isEditing ? (
					<div className="space-y-2">
						<Textarea
							value={editContent}
							onChange={(e) => setEditContent(e.target.value)}
							rows={3}
						/>
						<div className="flex gap-2">
							<Button size="sm" onClick={handleUpdate} disabled={!editContent.trim() || isUpdating}>
								{isUpdating ? "保存中..." : "保存"}
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => {
									setIsEditing(false);
									setEditContent(message.content);
								}}
							>
								取消
							</Button>
						</div>
					</div>
				) : (
					<p className="text-sm">{message.content}</p>
				)}
			</div>
		</div>
	);
};
