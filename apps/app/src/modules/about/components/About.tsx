import { HiOutlineAcademicCap as EducationIcon } from "react-icons/hi";

import Breakline from "@/common/components/elements/Breakline";

import EducationList from "./EducationList";
import Story from "./Story";

const About = () => {
	return (
		<section className="space-y-6">
			<Story />
			<Breakline />
			<div className="space-y-5">
				<div>
					<div className="flex gap-2 items-center">
						<EducationIcon size={24} strokeWidth={1} /> Education
					</div>
					<p className="pt-2 text-neutral-600 dark:text-neutral-400">
						My educational journey.
					</p>
				</div>
				<EducationList />
			</div>
		</section>
	);
};

export default About;
