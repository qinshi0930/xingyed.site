#!/usr/bin/env bun
/**
 * 阿里云生产环境部署脚本
 * 通过 SSH 免密连接，将本地构建的镜像部署到阿里云服务器
 *
 * 前置条件：
 * - 本地已配置 SSH 免密登录目标服务器
 * - 已执行 bun run bundle 生成 dist 产物
 *
 * 环境变量：
 * - ALIYUN_HOST（必填）: 阿里云服务器公网 IP
 * - ALIYUN_USER（可选）: SSH 用户名，默认 root
 * - ALIYUN_DEPLOY_PATH（可选）: 服务器部署路径，默认 /opt/xingye-site
 */

import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(__dirname, "..");
const distDir = resolve(appDir, "dist");

// 环境变量读取
const host = process.env.ALIYUN_HOST;
const user = process.env.ALIYUN_USER || "root";
const port = process.env.ALIYUN_PORT || "22";
const deployPath = process.env.ALIYUN_DEPLOY_PATH || "/opt/xingye-site";
const remote = `${user}@${host}`;

const sshOptions = port === "22" ? [] : ["-p", port];
const scpOptions = port === "22" ? [] : ["-P", port];

const imageName = "xingye-site:prod";
const tarName = "xingye-site-prod.tar";
const tarPath = resolve(distDir, tarName);

// 执行 shell 命令的辅助函数
function exec(cmd: string[], options?: { cwd?: string }): Promise<string> {
	return new Promise((resolve, reject) => {
		const proc = Bun.spawn(cmd, {
			cwd: options?.cwd,
			stdout: "pipe",
			stderr: "pipe",
		});
		const stdout: string[] = [];
		const stderr: string[] = [];
		proc.stdout.pipeTo(
			new WritableStream({
				write(chunk) {
					stdout.push(new TextDecoder().decode(chunk));
				},
			}),
		);
		proc.stderr.pipeTo(
			new WritableStream({
				write(chunk) {
					stderr.push(new TextDecoder().decode(chunk));
				},
			}),
		);
		proc.exited.then((code) => {
			if (code !== 0) {
				reject(new Error(stderr.join("") || stdout.join("")));
			} else {
				resolve(stdout.join(""));
			}
		});
	});
}

async function main() {
	console.log("🚀 开始阿里云生产环境部署...\n");

	// 步骤 1: 环境变量校验
	if (!host) {
		console.error("❌ 错误: 环境变量 ALIYUN_HOST 未设置");
		console.error("   示例: export ALIYUN_HOST=123.45.67.89");
		process.exit(1);
	}

	console.log(`📡 目标服务器: ${remote}`);
	console.log(`🔌 SSH 端口: ${port}`);
	console.log(`📂 部署路径: ${deployPath}\n`);

	// 步骤 2: 检查 dist 产物
	if (!existsSync(distDir)) {
		console.error("❌ 错误: dist 目录不存在，请先执行 bun run bundle");
		process.exit(1);
	}

	const requiredPaths = [
		resolve(distDir, "apps/app/.next/standalone"),
		resolve(distDir, "Dockerfile"),
		resolve(distDir, "podman-compose.yml"),
	];
	for (const p of requiredPaths) {
		if (!existsSync(p)) {
			console.error(`❌ 错误: dist 产物不完整，缺少 ${p}`);
			process.exit(1);
		}
	}

	// 步骤 3: 本地构建镜像
	console.log("🔨 步骤 1/7: 本地构建镜像...");
	await exec(["podman", "build", "-t", imageName, "."], { cwd: distDir });
	console.log(`   ✅ 镜像构建成功: ${imageName}\n`);

	// 步骤 4: 导出镜像
	console.log("📦 步骤 2/7: 导出镜像包...");
	await exec(["podman", "save", "-o", tarName, imageName], { cwd: distDir });
	console.log(`   ✅ 镜像导出成功: ${tarPath}\n`);

	// 步骤 5: 创建远程部署目录
	console.log("📁 步骤 3/7: 创建远程部署目录...");
	await exec(["ssh", ...sshOptions, remote, `mkdir -p ${deployPath}`]);
	console.log("   ✅ 远程目录已就绪\n");

	// 步骤 6: 上传镜像包
	console.log("⬆️  步骤 4/7: 上传镜像包到服务器...");
	await exec(["scp", ...scpOptions, tarPath, `${remote}:${deployPath}/`]);
	console.log("   ✅ 镜像包上传完成\n");

	// 步骤 7: 上传 podman-compose.yml
	console.log("⬆️  步骤 5/7: 上传 podman-compose.yml...");
	await exec([
		"scp",
		...scpOptions,
		resolve(distDir, "podman-compose.yml"),
		`${remote}:${deployPath}/`,
	]);
	console.log("   ✅ 编排文件上传完成\n");

	// 步骤 8: 服务器端操作
	console.log("🔧 步骤 6/7: 服务器端部署操作...");

	// 备份旧镜像（如果存在）
	const backupTag = `xingye-site:backup-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
	try {
		await exec([
			"ssh",
			...sshOptions,
			remote,
			`podman image exists ${imageName} && podman tag ${imageName} ${backupTag} || true`,
		]);
		console.log(`   🔄 旧镜像已备份为 ${backupTag}`);
	} catch {
		console.log("   ℹ️  无旧镜像需要备份");
	}

	// 导入新镜像
	await exec(["ssh", ...sshOptions, remote, `cd ${deployPath} && podman load -i ${tarName}`]);
	console.log("   ✅ 新镜像导入成功");

	// 停止并清理旧容器
	try {
		await exec(["ssh", ...sshOptions, remote, `cd ${deployPath} && podman-compose down`]);
		console.log("   ✅ 旧容器已清理");
	} catch {
		console.log("   ℹ️  无旧容器需要清理");
	}

	// 启动新容器
	await exec(["ssh", ...sshOptions, remote, `cd ${deployPath} && podman-compose up -d`]);
	console.log("   ✅ 新容器已启动\n");

	// 步骤 9: 清理服务器端 tar 包
	console.log("🧹 步骤 7/7: 清理临时文件...");
	await exec(["ssh", ...sshOptions, remote, `rm -f ${deployPath}/${tarName}`]);
	console.log("   ✅ 服务器临时文件已清理");

	// 清理本地 tar 包
	await exec(["rm", "-f", tarPath]);
	console.log("   ✅ 本地临时文件已清理\n");

	console.log("🎉 部署完成！");
	console.log(`   访问地址: http://${host}:3000`);
}

main().catch((err) => {
	console.error("\n❌ 部署失败:", err.message);
	process.exit(1);
});
