"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Loader2Icon } from "lucide-react";
import * as React from "react";

import { Button } from "@/common/components/shadcn/ui/button";
import { cn } from "@/common/components/shadcn/utils";

interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	isLoading?: boolean;
}

export const ConfirmDialog = ({
	open,
	onOpenChange,
	title,
	description,
	confirmText = "确认",
	cancelText = "取消",
	onConfirm,
	isLoading = false,
}: ConfirmDialogProps) => {
	return (
		<AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
			<AlertDialogPrimitive.Portal>
				<AlertDialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
				<AlertDialogPrimitive.Content
					className={cn(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-card p-6 shadow-lg rounded-lg",
					)}
				>
					<AlertDialogPrimitive.Title className="text-lg font-semibold text-foreground">
						{title}
					</AlertDialogPrimitive.Title>
					{description && (
						<AlertDialogPrimitive.Description className="text-sm text-muted-foreground">
							{description}
						</AlertDialogPrimitive.Description>
					)}
					<div className="flex flex-row justify-end gap-2 mt-4">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isLoading}
						>
							{cancelText}
						</Button>
						<Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
							{isLoading ? (
								<Loader2Icon className="h-4 w-4 animate-spin" />
							) : (
								confirmText
							)}
						</Button>
					</div>
				</AlertDialogPrimitive.Content>
			</AlertDialogPrimitive.Portal>
		</AlertDialogPrimitive.Root>
	);
};
