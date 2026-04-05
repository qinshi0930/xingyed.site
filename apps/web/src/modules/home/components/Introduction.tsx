export default function Introduction() {
	return (
		<section className="bg-cover bg-no-repeat ">
			<div className="space-y-3">
				<div className="flex gap-2  text-2xl font-medium lg:text-3xl">
					<h1>Hi, I&apos;m Adam</h1> <div className="ml-1 animate-waving-hand">👋</div>
				</div>
				<div className="space-y-4">
					<ul className="ml-5 flex list-disc flex-col gap-1 text-neutral-700 dark:text-neutral-400 lg:flex-row lg:gap-10">
						<li>
							Based in Shanghai, China <span className="ml-1">CN</span>
						</li>
						<li>远程工作</li>
					</ul>
				</div>
			</div>

			<p className="mt-6 leading-[1.8] text-neutral-800 dark:text-neutral-300 md:leading-loose">
				经验丰富的软件工程师，尤其是前段方面的软件工程师，热衷于创建像素完美的网络体验。我使用
				JavaScript
				并专注于万事万物网络，我热衷于团队合作，支付高效、可扩展且具有视觉吸引力的 Web
				应用程序。
			</p>
		</section>
	);
}
