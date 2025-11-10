import type { Metadata } from "next";

import { SWRConfig } from "swr";

import Container from "@/common/components/elements/Container";
import PageHeading from "@/common/components/elements/PageHeading";
import Dashboard from "@/modules/dashboard";
import { getGithubUser } from "@/services/github";

const PAGE_TITLE = "Dashboard";
const PAGE_DESCRIPTION =
	"This is my personal dashboard, built with Next.js API routes deployed as serverless functions.";

export const metadata: Metadata = {
	title: `${PAGE_TITLE} - Ryan Aulia`,
	description: PAGE_DESCRIPTION,
};

const DashboardPage = async () => {
	const githubUserPersonal = await getGithubUser("personal");

	return (
		<SWRConfig
			value={{
				fallback: {
					"/api/github?type=personal": githubUserPersonal?.data,
				},
			}}
		>
			<Container data-aos="fade-up">
				<PageHeading title={PAGE_TITLE} description={PAGE_DESCRIPTION} />
				<Dashboard />
			</Container>
		</SWRConfig>
	);
};

export default DashboardPage;
