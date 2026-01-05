import { HiOutlineAcademicCap as EducationIcon } from "react-icons/hi";

import Breakline from "@/common/components/elements/Breakline";

import EducationList from "./EducationList";
import Story from "./Story";

const About = () => {
	// const TABS = [
	// 	{
	// 		label: (
	// 			<TabLabel>
	// 				<AboutIcon size={17} /> Intro
	// 			</TabLabel>
	// 		),
	// 		children: <Story />,
	// 	},
	// 	// {
	// 	// 	label: (
	// 	// 		<TabLabel>
	// 	// 			<ResumeIcon size={17} /> Resume
	// 	// 		</TabLabel>
	// 	// 	),
	// 	// 	children: <Resume />,
	// 	// },
	// 	// {
	// 	// 	label: (
	// 	// 		<TabLabel>
	// 	// 			<CareerIcon size={17} /> Career
	// 	// 		</TabLabel>
	// 	// 	),
	// 	// 	children: <CareerList />,
	// 	// },
	// 	{
	// 		label: (
	// 			<TabLabel>
	// 				<EducationIcon size={17} /> Education
	// 			</TabLabel>
	// 		),
	// 		children: <EducationList />,
	// 	},
	// ];
	// // return <Tabs tabs={TABS} />;
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

// const TabLabel = ({ children }: { children: React.ReactNode }) => (
// 	<div className="flex items-center justify-center gap-1.5">{children}</div>
// );
