#!/usr/bin/env bun
/**
 * 本地生产环境部署脚本
 * 将 apps/app/dist 构建产物拷贝到 /var/www/xingyed.site/dist
 *
 * 前置条件:
 * - 已执行 bun run bundle 生成 dist 产物
 * - /var/www/xingyed.site 目录已存在
 *
 * 环境变量:
 * - LOCAL_DEPLOY_PATH(可选): 本地部署路径，默认 /var/www/xingyed.site
 */

import fs from "fs-extra";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(__dirname, "..");
const distDir = resolve(appDir, "dist");

// 配置
const deployPath = process.env.LOCAL_DEPLOY_PATH || "/var/www/xingyed.site";
const remoteDistDir = resolve(deployPath, "dist");

async function main() {
	console.log("🚀 开始本地部署...\n");

	// 步骤 1: 检查 dist 产物
	console.log("📦 步骤 1/3: 检查构建产物...");
	if (!existsSync(distDir)) {
		console.error("❌ 错误: dist 目录不存在，请先执行 bun run bundle");
		process.exit(1);
	}

	const requiredPaths = [resolve(distDir, "bundle"), resolve(distDir, ".env.production")];

	for (const p of requiredPaths) {
		if (!existsSync(p)) {
			console.error(`❌ 错误: dist 产物不完整，缺少 ${p}`);
			process.exit(1);
		}
	}
	console.log("   ✅ 构建产物完整\n");

	// 步骤 2: 清理远程 dist 目录
	console.log("🧹 步骤 2/3: 清理远程 dist 目录...");
	if (existsSync(remoteDistDir)) {
		await fs.remove(remoteDistDir);
		console.log("   ✅ 旧产物已清理");
	} else {
		await fs.ensureDir(remoteDistDir);
		console.log("   ✅ 部署目录已创建");
	}

	// 步骤 3: 拷贝 dist 产物
	console.log("\n📁 步骤 3/3: 拷贝构建产物...");
	await fs.copy(distDir, remoteDistDir);
	console.log(`   ✅ 产物已拷贝到 ${remoteDistDir}`);

	console.log("\n🎉 部署完成！");
	console.log(`   部署路径: ${remoteDistDir}`);
	console.log("\n📝 后续步骤:");
	console.log("   1. 进入部署目录: cd /var/www/xingyed.site");
	console.log("   2. 构建镜像: podman build -t xingye-site:stable .");
	console.log("   3. 启动容器: podman-compose up -d --force-recreate");
	console.log("   4. 查看日志: podman-compose logs -f");
}

main().catch((err) => {
	console.error("\n❌ 部署失败:", err.message);
	process.exit(1);
});
