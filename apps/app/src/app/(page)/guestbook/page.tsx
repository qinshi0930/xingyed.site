import type { Metadata } from "next";

import { headers } from "next/headers";

import { auth } from "@/api/auth";
import Container from "@/common/components/elements/Container";
import Guestbook from "@/modules/guestbook";

const PAGE_TITLE = "Guestbook";

export const metadata: Metadata = {
	title: `${PAGE_TITLE} - Adam`,
	description: "留下你的想法，与其他访客交流",
};

const GuestbookPage = async () => {
	// SSR 预取 session：消除 hydration 后首屏“未登录 → 已登录”闪烁
	// .catch 兜底：DB 抖动 / cookie 缺失时降级为客户端拉取，不让整页 500
	const initialSession = await auth.api
		.getSession({ headers: await headers() })
		.catch(() => null);

	return (
		<Container data-aos="fade-up">
			<Guestbook initialSession={initialSession} />
		</Container>
	);
};

export default GuestbookPage;
