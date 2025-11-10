"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { BsBuildings as CompanyIcon } from "react-icons/bs";
import { HiChevronRight } from "react-icons/hi";

import type { CareerProps } from "@/common/types/careers";

import Card from "@/common/components/elements/Card";
import Image from "@/common/components/elements/Image";
import { cn } from "@/common/components/shadcn/utils";
import { calculateDuration, formatDate } from "@/common/libs/utils/time";

const CareerCard = ({
	position,
	company,
	company_legal_name,
	logo,
	location,
	location_type,
	start_date,
	end_date,
	link,
	type,
	responsibilities,
}: CareerProps) => {
	const [isShowResponsibility, setIsShowResponsibility] = useState<boolean>(false);

	// const startDateFormatted = dayjs(start_date).format("MMM YYYY");
	// const endDateFormatted = end_date ? dayjs(end_date).format("MMM YYYY") : "Present";

	// const durationMonths = dayjs(end_date || Date.now()).diff(dayjs(start_date), "month");
	// const durationYears = Math.floor(durationMonths / 12);
	// const remainingMonths = durationMonths % 12;

	// const durationText = `${durationYears > 0 ? `${durationYears} Year${durationYears > 1 ? "s" : ""}, ` : ""}${remainingMonths} Month${remainingMonths > 1 ? "s" : ""}`;

	const startDateFormatted = formatDate(start_date, "MMM YYYY");
	const endDateFormatted = end_date ? formatDate(end_date, "MMM YYYY") : "Present";
	const durationText = calculateDuration(start_date, end_date);

	return (
		<Card className="flex gap-5 border border-neutral-300 px-6 py-4 dark:border-neutral-900">
			<div className="mt-1.5 w-fit">
				{logo ? (
					<Image
						src={logo}
						width={55}
						height={55}
						alt={company}
						className="h-14 w-14 rounded bg-neutral-50 p-1 hover:scale-110 hover:bg-transparent"
					/>
				) : (
					<CompanyIcon size={50} />
				)}
			</div>
			<div className="w-4/5 space-y-3">
				<div className="space-y-1">
					<h6>{position}</h6>
					<div className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
						<div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
							<a
								href={link || "#"}
								target="_blank"
								data-umami-event={`Click Career Company Name: ${company}`}
							>
								<span className="cursor-pointer underline-offset-2 hover:text-dark hover:underline hover:dark:text-white">
									{company}
								</span>
							</a>
							<span className="hidden text-neutral-300 dark:text-neutral-700 lg:block">
								•
							</span>
							<span className="text-neutral-500">[ {company_legal_name} ]</span>
							<span className="hidden text-neutral-300 dark:text-neutral-700 lg:block">
								•
							</span>
							<span>{location}</span>
						</div>
						<div className="flex flex-col gap-2 md:flex-row md:text-[13px]">
							<div className="flex gap-1">
								<span>
									{startDateFormatted} - {endDateFormatted}
								</span>
							</div>
							<span className="hidden text-neutral-300 dark:text-neutral-700 lg:block">
								•
							</span>
							<span className="text-neutral-500 dark:text-neutral-500">
								{durationText}
							</span>
							<span className="hidden text-neutral-300 dark:text-neutral-700 lg:block">
								•
							</span>
							<span>{type}</span>
							<span className="hidden text-neutral-300 dark:text-neutral-700 lg:block">
								•
							</span>
							<span>{location_type}</span>
						</div>
					</div>
				</div>
				<button
					type="button"
					onClick={() => setIsShowResponsibility(!isShowResponsibility)}
					className="-ml-1 mt-5 flex items-center gap-1 text-sm text-neutral-500"
				>
					<HiChevronRight
						size={18}
						className={cn({
							"rotate-90 transition-all duration-300": isShowResponsibility,
						})}
					/>
					{isShowResponsibility ? "Hide" : "Show"} Responsibilities
				</button>
				<AnimatePresence>
					{isShowResponsibility && (
						<motion.ul
							className="ml-5 list-disc space-y-1 pb-2 text-sm leading-normal text-neutral-600 dark:text-neutral-400"
							initial={{ y: -20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							exit={{ y: -20, opacity: 0 }}
							transition={{ duration: 0.3, ease: "easeInOut" }}
						>
							{responsibilities?.map((item) => (
								<motion.li key={item} layout>
									{item}
								</motion.li>
							))}
						</motion.ul>
					)}
				</AnimatePresence>
			</div>
		</Card>
	);
};

export default CareerCard;
