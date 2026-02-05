#!/bin/bash
# ECS 服务器清理脚本：从 PM2 迁移到 Podman
# 使用方法：将此脚本上传到 ECS，然后执行 bash cleanup-ecs.sh

set -e

echo "=========================================="
echo "🚀 开始清理 ECS 环境（PM2 → Podman）"
echo "=========================================="
echo ""

# 1. 检查当前 PM2 进程
echo "📋 步骤 1：检查当前 PM2 进程"
if command -v pm2 &> /dev/null; then
    echo "PM2 已安装，当前进程列表："
    pm2 list || true
else
    echo "PM2 未安装，跳过此步骤"
fi
echo ""

# 2. 停止所有 PM2 进程
echo "⏸️  步骤 2：停止所有 PM2 进程"
if command -v pm2 &> /dev/null; then
    pm2 stop all || echo "没有运行中的 PM2 进程"
    echo "✅ PM2 进程已停止"
else
    echo "⏭️  跳过"
fi
echo ""

# 3. 删除所有 PM2 应用
echo "🗑️  步骤 3：删除所有 PM2 应用"
if command -v pm2 &> /dev/null; then
    pm2 delete all || echo "没有 PM2 应用需要删除"
    echo "✅ PM2 应用已删除"
else
    echo "⏭️  跳过"
fi
echo ""

# 4. 禁用 PM2 开机自启
echo "🚫 步骤 4：禁用 PM2 开机自启"
if command -v pm2 &> /dev/null; then
    pm2 unstartup || echo "PM2 开机自启已禁用或未配置"
    echo "✅ PM2 开机自启已禁用"
else
    echo "⏭️  跳过"
fi
echo ""

# 5. 检查端口占用
echo "🔍 步骤 5：检查端口占用情况"
echo "检查 3000 端口（应用）："
sudo lsof -i :3000 || echo "✅ 3000 端口未被占用"
echo ""
echo "检查 6379 端口（Redis）："
sudo lsof -i :6379 || echo "✅ 6379 端口未被占用"
echo ""

# 6. 停止本地 Redis（如果有）
echo "🛑 步骤 6：停止本地 Redis 服务"
if systemctl is-active --quiet redis-server; then
    echo "检测到本地 Redis 正在运行，正在停止..."
    sudo systemctl stop redis-server
    sudo systemctl disable redis-server
    echo "✅ 本地 Redis 已停止并禁用"
else
    echo "✅ 本地 Redis 未运行"
fi
echo ""

# 7. 检查 Podman 安装状态
echo "🐋 步骤 7：检查 Podman 安装状态"
if command -v podman &> /dev/null; then
    echo "✅ Podman 已安装"
    podman --version
else
    echo "❌ Podman 未安装，请先安装："
    echo "   sudo apt update && sudo apt install -y podman podman-compose"
    exit 1
fi
echo ""

# 8. 检查 podman-compose 安装状态
echo "🔧 步骤 8：检查 podman-compose 安装状态"
if command -v podman-compose &> /dev/null; then
    echo "✅ podman-compose 已安装"
    podman-compose --version
else
    echo "❌ podman-compose 未安装，请先安装："
    echo "   sudo apt install -y podman-compose"
    exit 1
fi
echo ""

# 9. 检查项目目录
echo "📁 步骤 9：检查项目目录"
PROJECT_DIR="/var/www/xingye_site"
if [ -d "$PROJECT_DIR" ]; then
    echo "✅ 项目目录存在：$PROJECT_DIR"
    cd $PROJECT_DIR
    echo "当前目录内容："
    ls -lh
else
    echo "❌ 项目目录不存在：$PROJECT_DIR"
    exit 1
fi
echo ""

# 10. 检查必要文件
echo "📄 步骤 10：检查必要文件"
files=("docker-compose.yml" "Dockerfile" ".next" "package.json")
for file in "${files[@]}"; do
    if [ -e "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "⚠️  $file 不存在（可能需要先部署代码）"
    fi
done
echo ""

# 11. 清理旧的 Docker 容器（如果有）
echo "🧹 步骤 11：清理旧的 Docker 容器"
if command -v docker &> /dev/null; then
    echo "检测到 Docker，正在清理容器..."
    docker ps -q | xargs -r docker stop || true
    docker ps -aq | xargs -r docker rm || true
    echo "✅ Docker 容器已清理"
else
    echo "⏭️  Docker 未安装，跳过"
fi
echo ""

# 12. 启动 Podman 容器
echo "🚀 步骤 12：启动 Podman 容器"
read -p "是否立即启动 Podman 容器？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd $PROJECT_DIR
    echo "正在启动容器..."
    podman-compose -f docker-compose.yml up -d --build
    echo ""
    echo "等待服务启动..."
    sleep 10
    echo ""
    echo "容器状态："
    podman ps
    echo ""
    echo "测试应用（3000 端口）："
    curl -I http://localhost:3000 || echo "⚠️  应用未响应"
else
    echo "⏭️  跳过启动，你可以稍后手动执行："
    echo "   cd $PROJECT_DIR"
    echo "   podman-compose -f docker-compose.yml up -d --build"
fi
echo ""

# 13. 总结
echo "=========================================="
echo "✨ 清理完成！"
echo "=========================================="
echo ""
echo "📝 后续操作："
echo "1. 如果未启动容器，请执行："
echo "   cd $PROJECT_DIR"
echo "   podman-compose -f docker-compose.yml up -d --build"
echo ""
echo "2. 查看容器日志："
echo "   podman logs -f personalblog-app"
echo "   podman logs -f personalblog-redis"
echo ""
echo "3. 管理容器："
echo "   podman ps                    # 查看运行中的容器"
echo "   podman compose down          # 停止所有容器"
echo "   podman compose restart       # 重启所有容器"
echo ""
echo "4. 可选：完全卸载 PM2 和 Docker"
echo "   npm uninstall -g pm2"
echo "   sudo apt remove docker-ce docker-ce-cli containerd.io"
echo ""
