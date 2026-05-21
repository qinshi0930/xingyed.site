export interface GuestbookMessage {
	id: string;
	user_id: string;
	user_name: string;
	user_image?: string;
	github_username: string;
	content: string;
	created_at: string;
	updated_at: string;
}

/** 带乐观更新标记的留言类型 */
export interface OptimisticGuestbookMessage extends GuestbookMessage {
	_optimistic?: boolean;
}

export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}
