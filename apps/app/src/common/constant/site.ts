/**
 * 站点部署形态开关。
 *
 * 自托管主站（阿里云 + nginx）功能完整；
 * Vercel 作为只读镜像部署，需关闭留言板、登录这类依赖数据库的交互功能。
 *
 * 在 Vercel 项目环境变量中设置：
 *   NEXT_PUBLIC_SITE_READONLY=1
 * 自托管环境不要设置（默认关闭）。
 *
 * 注意：必须使用 NEXT_PUBLIC_ 前缀，客户端构建期需要内联该值。
 */
const TRUTHY_VALUES = new Set(["1", "true", "yes", "on"]);

export const IS_READONLY_SITE = TRUTHY_VALUES.has(
	(process.env.NEXT_PUBLIC_SITE_READONLY ?? "").trim().toLowerCase(),
);

/**
 * ICP 备案号：仅国内自托管部署需要展示。
 *
 * 由构建期变量注入（见 scripts/deploy/release.sh）；
 * Vercel 不设置该变量，页脚便不渲染备案信息。
 */
export const ICP_BEIAN = (process.env.NEXT_PUBLIC_ICP_BEIAN ?? "").trim();
