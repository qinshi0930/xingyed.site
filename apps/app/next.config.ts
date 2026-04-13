import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	output: "standalone",
	pageExtensions: ["js", "jsx", "ts", "tsx"],
	transpilePackages: ["next-mdx-remote", "@repo/types", "@repo/utils"],
	// 显式配置 Turbopack 根目录，消除多 lockfile 警告
	turbopack: {
		root: "/home/xingye/workspace/xingyed.site",
	},
	// serverExternalPackages: [""],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "picsum.photos",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "placehold.co",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "cloud.aulianza.com",
				pathname: "/**",
			},
			{
				protocol: "http",
				hostname: "localhost",
				port: "8080",
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
