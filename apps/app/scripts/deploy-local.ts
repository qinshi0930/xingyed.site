#!/usr/bin/env bun
/**
 * 本地生产环境部署脚本
 * 将 apps/app/dist 构建产物拷贝到 /var/www/xingyed.site/dist 并启动容器
 *
 * 前置条件:
 * - 已执行 bun run bundle 生成 dist 产物
 * - /var/www/xingyed.site 目录已存在
 * - podman 和 podman-compose 已安装
 *
 * 环境变量:
 * - LOCAL_DEPLOY_PATH(可选): 本地部署路径，默认 /var/www/xingyed.site
 */

import fs from "fs-extra";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(__dirname, "..");
const distDir = resolve(appDir, "dist");

// 配置
const deployPath = process.env.LOCAL_DEPLOY_PATH || "/var/www/xingyed.site";
const remoteDistDir = resolve(deployPath, "dist");
const imageName = "xingye-site:stable";

// 执行 shell 命令的辅助函数
async function exec(cmd: string[], options?: { cwd?: string }): Promise<string> {
	try {
		const { stdout } = await execFileAsync(cmd[0], cmd.slice(1), {
			cwd: options?.cwd,
			maxBuffer: 10 * 1024 * 1024, // 10MB 缓冲区
		});
		return stdout;
	} catch (err: any) {
		throw new Error(err.stderr || err.stdout || err.message);
	}
}

async function main() {
	console.log("🚀 开始本地生产环境部署...\n");

	// 步骤 1: 检查 dist 产物
	console.log("📦 步骤 1/5: 检查构建产物...");
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
	console.log("🧹 步骤 2/5: 清理远程 dist 目录...");
	if (existsSync(remoteDistDir)) {
		await fs.remove(remoteDistDir);
		console.log("   ✅ 旧产物已清理");
	} else {
		await fs.ensureDir(remoteDistDir);
		console.log("   ✅ 部署目录已创建");
	}

	// 步骤 3: 拷贝 dist 产物
	console.log("\n📁 步骤 3/5: 拷贝构建产物...");
	await fs.copy(distDir, remoteDistDir);
	console.log(`   ✅ 产物已拷贝到 ${remoteDistDir}`);

	// 拷贝 Dockerfile 和 compose 文件
	const dockerfileSrc = resolve(appDir, "../..", "Dockerfile");
	const composeSrc = resolve(appDir, "../..", "podman-compose.yml");

	if (existsSync(dockerfileSrc)) {
		await fs.copy(dockerfileSrc, resolve(deployPath, "Dockerfile"));
		console.log("   ✅ Dockerfile 已拷贝");
	}

	if (existsSync(composeSrc)) {
		await fs.copy(composeSrc, resolve(deployPath, "podman-compose.yml"));
		console.log("   ✅ podman-compose.yml 已拷贝");
	}
	console.log();

	// 步骤 4: 构建镜像并启动容器
	console.log("🔧 步骤 4/5: 构建镜像并启动容器...");

	// 备份旧镜像
	const backupTag = `xingye-site:backup-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
	try {
		await exec(["podman", "image", "exists", imageName], { cwd: deployPath });
		await exec(["podman", "tag", imageName, backupTag], { cwd: deployPath });
		console.log(`   🔄 旧镜像已备份为 ${backupTag}`);
	} catch {
		console.log("   ℹ️  无旧镜像需要备份");
	}

	// 构建新镜像
	console.log("   📦 构建 Docker 镜像...");
	await exec(["podman", "build", "-t", imageName, "."], { cwd: deployPath });
	console.log("   ✅ 镜像构建成功");

	// 停止旧容器
	try {
		await exec(["podman-compose", "down"], { cwd: deployPath });
		console.log("   ✅ 旧容器已清理");
	} catch {
		console.log("   ℹ️  无旧容器需要清理");
	}

	// 启动新容器
	console.log("   🚀 启动新容器...");
	await exec(["podman-compose", "up", "-d", "--force-recreate"], { cwd: deployPath });
	console.log("   ✅ 新容器已启动\n");

	// 步骤 5: 健康检查
	console.log("🏥 步骤 5/5: 健康检查...");
	const MAX_RETRIES = 30;
	let retryCount = 0;

	while (retryCount < MAX_RETRIES) {
		try {
			await exec(["curl", "-f", "-s", "http://localhost:3000/api/health"]);
			console.log("   ✅ 健康检查通过！\n");
			break;
		} catch {
			retryCount++;
			if (retryCount >= MAX_RETRIES) {
				console.error(`   ❌ 健康检查失败（${MAX_RETRIES} 次重试后）`);
				console.error("   提示: 运行以下命令查看容器日志:");
				console.error("   podman-compose -f podman-compose.yml logs\n");
				process.exit(1);
			}
			process.stdout.write(`   ⏳ 等待服务启动... (${retryCount}/${MAX_RETRIES})\r`);
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
	}

	// 显示容器状态
	console.log("📊 容器状态:");
	const psOutput = await exec(["podman-compose", "ps"], { cwd: deployPath });
	console.log(psOutput);

	console.log("🎉 本地部署完成！");
	console.log(`   访问地址: http://localhost:3000`);
	console.log(`   部署路径: ${deployPath}`);
	console.log(`   镜像名称: ${imageName}`);
	console.log("\n📝 常用命令:");
	console.log("   查看日志: podman-compose -f podman-compose.yml logs -f");
	console.log("   停止服务: podman-compose -f podman-compose.yml down");
	console.log("   重启服务: podman-compose -f podman-compose.yml restart");
}

main().catch((err) => {
	console.error("\n❌ 部署失败:", err.message);
	process.exit(1);
});
