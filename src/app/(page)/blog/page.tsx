import type { Metadata } from "next";

import Container from "@/common/components/elements/Container";
import BlogListNew from "@/modules/blog";

const PAGE_TITLE = "Blog";

export const metadata: Metadata = {
	title: `${PAGE_TITLE} - Adam`,
};

const BlogPage = () => {
	return (
		<>
			<Container className="xl:!-mt-5" data-aos="fade-up">
				<BlogListNew />
			</Container>
		</>
	);
};

export default BlogPage;
