import { CAREERS } from "@/common/constant/careers";

import CareerCard from "./CareerCard";

const CareerList = () => {
	return (
		<section className="space-y-6">
			<div className="grid gap-3 ">
				{CAREERS?.map((career, index) => (
					// eslint-disable-next-line react/no-array-index-key
					<CareerCard key={index} {...career} />
				))}
			</div>
		</section>
	);
};

export default CareerList;
