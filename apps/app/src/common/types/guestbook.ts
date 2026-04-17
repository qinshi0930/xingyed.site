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

export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}
