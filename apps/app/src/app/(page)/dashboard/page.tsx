import type { Metadata } from "next";

import Container from "@/common/components/elements/Container";
import PageHeading from "@/common/components/elements/PageHeading";
import Dashboard from "@/modules/dashboard";

const PAGE_TITLE = "Dashboard";
const PAGE_DESCRIPTION =
	"This is my personal dashboard, built with Next.js API routes deployed as serverless functions.";

export const metadata: Metadata = {
	title: `${PAGE_TITLE} - Adam`,
	description: PAGE_DESCRIPTION,
};

const DashboardPage = async () => {
	return (
		<Container data-aos="fade-up">
			<PageHeading title={PAGE_TITLE} description={PAGE_DESCRIPTION} />
			<Dashboard />
		</Container>
	);
};

export default DashboardPage;
