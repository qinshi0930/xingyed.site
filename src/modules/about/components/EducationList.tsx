import { EDUCATION } from "@/common/constant/education";

import EducationCard from "./EducationCard";

const EducationList = () => {
	return (
		<section className="space-y-6">
			<div className="grid gap-4 md:grid-cols-1">
				{EDUCATION?.map((item, index) => (
					// eslint-disable-next-line react/no-array-index-key
					<EducationCard key={index} {...item} />
				))}
			</div>
		</section>
	);
};

export default EducationList;
