import { toast } from "sonner";

import { signOut } from "@/common/libs/auth-client";

interface ApiErrorBody {
	success?: boolean;
	error?: string;
	message?: string;
}

/**
 * 统一的 API 错误：
 * - status === 0 表示网络层失败（fetch reject）
 * - body 为响应体（解析失败时为 null）
 */
export class ApiError extends Error {
	public readonly status: number;
	public readonly body: ApiErrorBody | null;

	constructor(status: number, body: ApiErrorBody | null) {
		super(body?.error ?? `API error ${status}`);
		this.name = "ApiError";
		this.status = status;
		this.body = body;
	}
}

interface ApiFetchOptions extends RequestInit {
	/** HTTP !ok 且响应体无 error 字段时的兜底 toast 文案 */
	defaultErrorMessage?: string;
	/** 禁用 apiFetch 内置 toast（用于静默 GET 状态检查） */
	silent?: boolean;
}

/**
 * 统一的 API 调用工具：
 * - 自动 JSON 解析，自动注入 Content-Type（仅当 body 存在）
 * - 401: toast.warning 登录已过期 + signOut（依赖 useSession 自然反应回未登录态，保留草稿）
 * - 403: toast.error 权限不足
 * - 网络层失败: toast.error 网络错误
 * - 其他 4xx/5xx: toast.error(body.error ?? defaultErrorMessage)
 * - 成功: 返回 body.data ?? body
 *
 * 失败统一抛出 ApiError，调用点 catch 后只需做业务清理（如 setSubmitting(false)）
 */
export async function apiFetch<T = unknown>(
	input: RequestInfo | URL,
	options: ApiFetchOptions = {},
): Promise<T> {
	const { defaultErrorMessage = "请求失败", silent, headers, ...init } = options;

	let response: Response;
	try {
		response = await fetch(input, {
			...init,
			headers: {
				// init.body 存在时默认 application/json；调用点显式 headers 优先级更高
				...(init.body ? { "Content-Type": "application/json" } : {}),
				...headers,
			},
		});
	} catch {
		if (!silent) toast.error("网络错误，请稍后重试");
		throw new ApiError(0, null);
	}

	// 兼容 204 / HTML 错误页 / 非 JSON 响应
	let body: (ApiErrorBody & { data?: T }) | null = null;
	try {
		body = (await response.json()) as ApiErrorBody & { data?: T };
	} catch {
		body = null;
	}

	if (!response.ok) {
		if (response.status === 401) {
			if (!silent) toast.warning("登录已过期，请重新登录");
			// signOut 失败不影响 UI：useSession 下次拉取自然返回 null
			void signOut().catch(() => undefined);
		} else if (response.status === 403) {
			if (!silent) toast.error(body?.error ?? "权限不足，无法操作");
		} else if (!silent) {
			toast.error(body?.error ?? defaultErrorMessage);
		}
		throw new ApiError(response.status, body);
	}

	// 业务层 success: false 兜底（200 + 失败的边界情况）
	if (body && body.success === false) {
		if (!silent) toast.error(body.error ?? defaultErrorMessage);
		throw new ApiError(response.status, body);
	}

	// 优先返回 data 字段（POST/PUT 形态），无则返回整个 body（DELETE 仅返 message 形态）
	return (body?.data ?? body) as T;
}
