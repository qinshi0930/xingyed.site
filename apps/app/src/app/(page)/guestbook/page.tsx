import type { Metadata } from "next";

import Container from "@/common/components/elements/Container";
import Guestbook from "@/modules/guestbook";

const PAGE_TITLE = "Guestbook";

export const metadata: Metadata = {
	title: `${PAGE_TITLE} - Adam`,
	description: "留下你的想法，与其他访客交流",
};

const GuestbookPage = () => {
	return (
		<Container data-aos="fade-up">
			<Guestbook />
		</Container>
	);
};

export default GuestbookPage;
