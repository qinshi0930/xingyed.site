"use client";

import { EditIcon, Loader2Icon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { OptimisticGuestbookMessage } from "@/common/types/guestbook";

import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/shadcn/ui/avatar";
import { Button } from "@/common/components/shadcn/ui/button";
import { Textarea } from "@/common/components/shadcn/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/common/components/shadcn/ui/tooltip";
import { apiFetch } from "@/common/libs/api-fetch";
import { useSession } from "@/common/libs/auth-client";
import { formatDate, formatRelativeTime } from "@/common/libs/utils/time";

import { ConfirmDialog } from "./ConfirmDialog";

interface MessageItemProps {
	message: OptimisticGuestbookMessage;
	onUpdate: () => void;
	onDelete: () => void;
}

export const MessageItem = ({ message, onUpdate, onDelete }: MessageItemProps) => {
	const { data: session } = useSession();
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(message.content);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	const isOwner = session?.user?.id === message.user_id;

	const handleUpdate = async () => {
		if (!editContent.trim() || isUpdating) return;

		setIsUpdating(true);

		try {
			await apiFetch(`/api/guestbook/${message.id}`, {
				method: "PUT",
				body: JSON.stringify({ message: editContent.trim() }),
				defaultErrorMessage: "更新失败",
			});
			toast.success("更新成功！");
			setIsEditing(false);
			onUpdate();
		} catch {
			// apiFetch 已统一弹 toast，仅业务清理
		} finally {
			setIsUpdating(false);
		}
	};

	const handleDelete = () => {
		if (isDeleting) return;
		setIsDeleteDialogOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (isDeleting) return;

		setIsDeleting(true);

		try {
			await apiFetch(`/api/guestbook/${message.id}`, {
				method: "DELETE",
				defaultErrorMessage: "删除失败",
			});
			toast.success("删除成功！");
			setIsDeleteDialogOpen(false);
			onDelete();
		} catch {
			// apiFetch 已统一弹 toast，仅业务清理
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div
			className={`flex gap-3 p-4 border rounded-lg bg-card${message._optimistic ? " opacity-60" : ""}`}
		>
			<Avatar className="h-10 w-10">
				<AvatarImage src={message.user_image || ""} alt={message.user_name} />
				<AvatarFallback>{message.user_name.charAt(0)}</AvatarFallback>
			</Avatar>

			<div className="flex-1 space-y-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="font-medium">@{message.github_username}</span>
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="text-xs text-muted-foreground cursor-default">
									{formatRelativeTime(message.created_at)}
								</span>
							</TooltipTrigger>
							<TooltipContent>
								{formatDate(message.created_at, "YYYY-MM-DD HH:mm:ss")}
							</TooltipContent>
						</Tooltip>
					</div>

					{isOwner && !isEditing && (
						<div className="flex gap-1">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsEditing(true)}
								disabled={isDeleting}
							>
								<EditIcon className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleDelete}
								disabled={isDeleting}
							>
								{isDeleting ? (
									<Loader2Icon className="h-4 w-4 animate-spin" />
								) : (
									<TrashIcon className="h-4 w-4" />
								)}
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
							<Button
								size="sm"
								onClick={handleUpdate}
								disabled={!editContent.trim() || isUpdating}
							>
								{isUpdating ? "保存中..." : "保存"}
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => {
									setIsEditing(false);
									setEditContent(message.content);
								}}
								disabled={isUpdating}
							>
								取消
							</Button>
						</div>
					</div>
				) : (
					<p className="text-sm">{message.content}</p>
				)}
			</div>

			<ConfirmDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				title="删除留言"
				description="确定要删除这条留言吗？此操作不可撤销。"
				confirmText="删除"
				cancelText="取消"
				onConfirm={handleConfirmDelete}
				isLoading={isDeleting}
			/>
		</div>
	);
};
