import type { PropsWithChildren } from "react";

import Layout from "@/common/components/layouts";

export default function AppLayout({ children }: PropsWithChildren) {
	return <Layout>{children}</Layout>;
}
