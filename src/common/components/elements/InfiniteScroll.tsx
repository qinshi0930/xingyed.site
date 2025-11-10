// components/InfiniteVirtualList.tsx
import { useVirtualizer } from "@tanstack/react-virtual";
import { forwardRef, useEffect, useRef } from "react";

interface InfiniteVirtualListProps {
	itemCount: number; // 总 item 数量（不含 loader）
	hasNextPage?: boolean; // 是否还有下一页
	onLoadMore: () => void; // 加载更多回调
	estimateSize: (index: number) => number;
	overscan?: number;
	children: (props: { index: number }) => React.ReactNode;
}

const InfiniteVirtualList = forwardRef<HTMLDivElement, InfiniteVirtualListProps>(
	({ itemCount, hasNextPage = false, onLoadMore, estimateSize, overscan = 5, children }, ref) => {
		const localRef = useRef<HTMLDivElement>(null);
		const scrollRef = (ref as React.RefObject<HTMLDivElement>) || localRef;

		// 虚拟列表总长度：如果有下一页，+1 用于加载指示器
		const totalItemCount = hasNextPage ? itemCount + 1 : itemCount;

		const virtualizer = useVirtualizer({
			count: totalItemCount,
			getScrollElement: () => scrollRef.current,
			estimateSize: (index) => {
				return hasNextPage && index === itemCount ? 40 : estimateSize(index);
			},
			overscan,
		});

		// 滚动到底部时加载更多
		useEffect(() => {
			const scrollEl = scrollRef.current;
			if (!scrollEl) return;

			const handleScroll = () => {
				const { scrollTop, scrollHeight, clientHeight } = scrollEl;
				if (scrollTop + clientHeight >= scrollHeight - 100 && hasNextPage) {
					onLoadMore();
				}
			};

			scrollEl.addEventListener("scroll", handleScroll, { passive: true });
			return () => scrollEl.removeEventListener("scroll", handleScroll);
		}, [hasNextPage, onLoadMore]);

		const virtualItems = virtualizer.getVirtualItems();

		return (
			<div
				ref={scrollRef}
				style={{
					overflow: "auto",
					position: "relative",
					height: "100%",
				}}
			>
				<div
					style={{
						height: `${virtualizer.getTotalSize()}px`,
						position: "relative",
						width: "100%",
					}}
				>
					{virtualItems.map((virtualItem) => {
						const isLoader = hasNextPage && virtualItem.index === itemCount;

						return (
							<div
								key={virtualItem.key}
								data-index={virtualItem.index}
								ref={virtualizer.measureElement}
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									transform: `translateY(${virtualItem.start}px)`,
								}}
							>
								{isLoader ? (
									<div style={{ padding: "12px", textAlign: "center" }}>
										Loading more...
									</div>
								) : (
									children({ index: virtualItem.index })
								)}
							</div>
						);
					})}
				</div>
			</div>
		);
	},
);

InfiniteVirtualList.displayName = "InfiniteVirtualList";

export default InfiniteVirtualList;
