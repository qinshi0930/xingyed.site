#!/usr/bin/env bun
/**
 * 构建产物打包脚本
 * 将 standalone 构建产物和静态资源拷贝到 dist 目录
 */

import fs from "fs-extra";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(__dirname, "..");
const rootDir = resolve(appDir, "../..");
const distDir = resolve(appDir, "dist");

const sourcePaths = {
	standalone: resolve(appDir, ".next/standalone/"),
	static: resolve(appDir, ".next/static"),
	public: resolve(appDir, "public"),
	contents: resolve(appDir, "src/contents"),
	envProduction: resolve(rootDir, ".env.production"),
};

const targetPaths = {
	standalone: resolve(distDir, "bundle/"),
	static: resolve(distDir, "bundle/apps/app/.next/static"),
	public: resolve(distDir, "bundle/apps/app/public"),
	contents: resolve(distDir, "bundle/apps/app/src/contents"),
	envProduction: resolve(distDir, ".env.production"),
};

console.log("📦 开始打包构建产物...\n");

// 步骤 1: 检查 standalone 产物是否存在
if (!existsSync(sourcePaths.standalone)) {
	console.error("❌ 错误: .next/standalone 目录不存在，请先执行构建命令");
	process.exit(1);
}

// 步骤 2: 清理并创建 dist 目录
console.log("🧹 清理 dist 目录...");
if (existsSync(distDir)) {
	await fs.remove(distDir);
}
await fs.ensureDir(distDir);

// 步骤 3: 拷贝 standalone 产物
console.log("📁 拷贝 standalone 产物...");
await fs.copy(sourcePaths.standalone, targetPaths.standalone);

// 步骤 4: 拷贝 static 静态资源
console.log("📁 拷贝 static 静态资源...");
await fs.copy(sourcePaths.static, targetPaths.static);

// 步骤 5: 拷贝 public 目录
console.log("📁 拷贝 public 目录...");
await fs.copy(sourcePaths.public, targetPaths.public);

// 步骤 6: 拷贝 src/contents 目录
console.log("📁 拷贝 src/contents 目录...");
await fs.copy(sourcePaths.contents, targetPaths.contents);

// 步骤 7: 拷贝根目录配置文件
console.log("📄 拷贝 .env.production...");
await fs.copy(sourcePaths.envProduction, targetPaths.envProduction);

console.log("\n✅ 打包完成！输出目录: dist/");
console.log("\n📂 产物结构:");
console.log("  dist/");
console.log("  ├── bundle/");
console.log("  │   └── apps/app/");
console.log("  │       ├── .next/              # Next.js standalone 产物");
console.log("  │       │   ├── server/         # 服务端代码");
console.log("  │       │   └── static/         # 静态资源（构建时生成）");
console.log("  │       ├── public/             # 公共静态资源（字体、图片等）");
console.log("  │       └── src/contents/       # 内容数据（blog、learn、projects）");
console.log("  ├── .env.production             # 环境变量（运行时由 compose 加载，不打包进镜像）");
