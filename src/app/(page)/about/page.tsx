import type { Metadata } from "next";

import Container from "@/common/components/elements/Container";
import PageHeading from "@/common/components/elements/PageHeading";
import About from "@/modules/about";

const PAGE_TITLE = "About";
const PAGE_DESCRIPTION =
	"An insightful glimpse into who I am – because every detail adds depth to the canvas of life.";

export const metadata: Metadata = {
	title: `${PAGE_TITLE} - Adam`,
	description: `${PAGE_DESCRIPTION}`,
};

const AboutPage = () => {
	return (
		<>
			<Container data-aos="fade-up">
				<PageHeading title={PAGE_TITLE} description={PAGE_DESCRIPTION} />
				<About />
			</Container>
		</>
	);
};

export default AboutPage;
