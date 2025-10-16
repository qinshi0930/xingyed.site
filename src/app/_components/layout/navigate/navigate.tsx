import { BookOpen, Code, Coffee, Cpu, House, Layers, Mail, Rss, User } from "lucide-react";
import Link from "next/link";

import { Label } from "@/app/_components/shadcn/ui/label";

import { cn } from "../../shadcn/utils";
import $styles from "./navigate.module.css";

const iconMap = {
	house: House,
	cpu: Cpu,
	coffee: Coffee,
	rss: Rss,
	layers: Layers,
	code: Code,
	bookOpen: BookOpen,
	user: User,
	mail: Mail,
} as const;

interface NavItem {
	label: string;
	href: string;
	icon: keyof typeof iconMap;
}

const navItems: NavItem[] = [
	{ href: "#Home", label: "Home", icon: "house" },
	{ href: "#Dashboard", label: "Dashboard", icon: "cpu" },
	{ href: "#Project", label: "Project", icon: "coffee" },
	{ href: "#Blog", label: "Blog", icon: "rss" },
	{ href: "#Weekly", label: "Weekly", icon: "layers" },
	{ href: "#Cheatsheet", label: "Cheatsheet", icon: "code" },
	{ href: "#Learn", label: "Learn", icon: "bookOpen" },
	{ href: "#About", label: "About", icon: "user" },
	{ href: "#Contact", label: "Contact", icon: "mail" },
];

export default function Navigate() {
	return (
		<nav className="flex flex-col gap-1">
			{navItems.map((item) => {
				const Icon = iconMap[item.icon] as React.ComponentType<{ className?: string }>;

				return (
					<Link key={item.label} href={item.href}>
						<div className={cn($styles.navigate, "group")}>
							<Icon className={cn($styles.icon, "group-hover:-rotate-15")} />
							<Label className="text-xl">{item.label}</Label>
						</div>
					</Link>
				);
			})}
		</nav>
	);
}
