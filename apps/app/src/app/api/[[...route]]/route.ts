import { handle } from "hono/vercel";

import app from "@/api";

// 导出所有 HTTP 方法，委托给 Hono 应用处理
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
