import { cn } from "@/app/_components/shadcn/utils";

interface DividerProps {
	className?: string;
}

export function Divider({ className = "" }: DividerProps) {
	return (
		<div className={cn("border-t dark:border-neutral-700 border-gray-300 my-4", className)} />
	);
}
