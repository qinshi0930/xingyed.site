import type { Metadata } from "next";

import { Suspense } from "react";

import Container from "@/common/components/elements/Container";
import BlogListNew from "@/modules/blog";

const PAGE_TITLE = "Blog";

export const metadata: Metadata = {
	title: `${PAGE_TITLE} - Adam`,
};

const BlogPage = () => {
	return (
		<Suspense>
			<Container className="xl:!-mt-5" data-aos="fade-up">
				<BlogListNew />
			</Container>
		</Suspense>
	);
};

export default BlogPage;
