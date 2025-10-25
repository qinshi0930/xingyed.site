"use client";

import type { PropsWithChildren } from "react";

import { MDXProvider as BaseMDXProvider } from "@mdx-js/react";

import { useMDXComponents } from "@/mdx-components";

export function MDXWrapper({ children }: PropsWithChildren) {
	const components = useMDXComponents();

	return <>{children}</>;
}

export function MDXProvider({ children }: PropsWithChildren) {
	return <BaseMDXProvider>{children}</BaseMDXProvider>;
}
