import type { PropsWithChildren } from "react";

import { AppSidebar, Welcome } from "../_components/layout";

export default function AppLayout({ children }: PropsWithChildren) {
	return (
		<div className="wrapper">
			<header>
				<Welcome />
			</header>
			<div className="max-w-6xl mx-auto lg:px-8">
				<div className="mt-10 pb-10 lg:mt-0">
					<div className="flex flex-col lg:flex-row lg:gap-5 lg:py-4 xl:pb-8">
						<aside className="lg:w-1/5">
							<AppSidebar />
						</aside>
						<main className="lg:w-4/5 max-w-[854px] transition-all duration-300">
							{children}
						</main>
					</div>
				</div>
			</div>
		</div>
	);
}
