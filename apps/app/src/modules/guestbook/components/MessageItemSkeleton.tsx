import { Skeleton } from "@/common/components/shadcn/ui/skeleton";

export const MessageItemSkeleton = () => (
	<div className="flex gap-3 p-4 border rounded-lg bg-card">
		<Skeleton className="h-10 w-10 rounded-full shrink-0" />
		<div className="flex-1 space-y-2">
			<div className="flex items-center gap-2">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-3 w-16" />
			</div>
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-3/4" />
		</div>
	</div>
);
