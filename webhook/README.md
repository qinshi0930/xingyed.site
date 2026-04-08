# GitHub Webhook 自动部署配置指南

## 📋 概述

本指南介绍如何使用 Adnanh Webhook 实现 GitHub 推送代码后自动部署到服务器。

## 🎯 工作原理

```
开发者 push 代码到 GitHub
    ↓
GitHub 检测到推送事件
    ↓
GitHub 发送 HTTP POST 请求到服务器 webhook 服务
    ↓
Webhook 服务验证请求签名
    ↓
执行部署脚本 (deploy.sh)
    ↓
部署脚本：
  - git pull 拉取代码
  - podman-compose 重新构建
  - 健康检查
    ↓
部署完成！
```

---

## 📦 安装步骤

### 步骤 1: 安装 Webhook 工具

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install webhook

# 或手动安装最新版本
wget https://github.com/adnanh/webhook/releases/download/2.8.1/webhook-linux-amd64.tar.gz
tar -xzf webhook-linux-amd64.tar.gz
sudo mv webhook-linux-amd64/webhook /usr/local/bin/
sudo chmod +x /usr/local/bin/webhook

# 验证安装
webhook -version
```

### 步骤 2: 创建配置目录

```bash
# 创建目录
sudo mkdir -p /opt/webhook/scripts
sudo chown $USER:$USER /opt/webhook

# 复制配置文件（从项目的 webhook 目录）
cd /path/to/xingyed.site
cp webhook/hooks.json /opt/webhook/
cp webhook/scripts/deploy.sh /opt/webhook/scripts/
chmod +x /opt/webhook/scripts/deploy.sh
```

### 步骤 3: 生成 Secret 并配置 hooks.json

#### 3.1 生成 Webhook Secret

使用 OpenSSL 生成安全的随机密钥：

```bash
# 生成 32 字节的随机密钥（64 个十六进制字符）
openssl rand -hex 32

# 输出示例：
# a3f8b9c2d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0
```

**其他生成方法：**

```bash
# 方法 2：使用 /dev/urandom
cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1

# 方法 3：使用 Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

复制生成的密钥，后面会用到。

#### 3.2 修改 hooks.json

编辑配置文件：

```bash
sudo nano /opt/webhook/hooks.json
```

需要修改以下字段：

```json
{
  "id": "deploy-xingyed-site",
  "execute-command": "/opt/webhook/scripts/deploy.sh",
  "command-working-directory": "/home/你的用户名/xingyed.site",  // ← 修改为你的项目路径
  "response-message": "Deployment started!",
  "trigger-rule": {
    "and": [
      {
        "match": {
          "type": "value",
          "value": "refs/heads/main",
          "parameter": {
            "source": "payload",
            "name": "ref"
          }
        }
      },
      {
        "match": {
          "type": "payload-hash-sha256",
          "secret": "粘贴刚才生成的密钥",  // ← 修改为生成的密钥
          "parameter": {
            "source": "header",
            "name": "X-Hub-Signature-256"
          }
        }
      }
    ]
  }
}
```

**关键字段说明：**
- `command-working-directory`: 你的项目目录路径
- `secret`: 用于 HMAC 签名验证的密钥（必须是强随机密钥）

### 步骤 4: 配置部署脚本

编辑 `/opt/webhook/scripts/deploy.sh`：

```bash
sudo nano /opt/webhook/scripts/deploy.sh
```

修改项目路径：

```bash
PROJECT_DIR="/home/你的用户名/xingyed.site"  # ← 修改这里
```

**错误处理机制：**

脚本具有完善的错误处理：

1. **自动错误捕获** - 使用 `trap` 捕获所有错误
2. **友好的错误提示** - 失败时显示日志位置
3. **关键步骤检查** - git pull、构建、健康检查等

**错误示例输出：**

```bash
=========================================
📝 日志文件: /var/log/webhook/deploy-2024-04-08-143025.log
📁 日志目录: /var/log/webhook
🔍 查看日志: tail -f /var/log/webhook/deploy-2024-04-08-143025.log
📋 所有日志: ls -lh /var/log/webhook/
=========================================
[2024-04-08 14:30:25] =========================================
[2024-04-08 14:30:25] Deployment triggered
[2024-04-08 14:30:25] Commit: feat: add new feature
[2024-04-08 14:30:25] =========================================
[2024-04-08 14:30:25] Step 1: Pulling latest code...
fatal: not a git repository (or any of the parent directories)
[2024-04-08 14:30:26] =========================================
[2024-04-08 14:30:26] ❌ Deployment failed!
[2024-04-08 14:30:26] =========================================
[2024-04-08 14:30:26] Error: Failed to pull latest code
[2024-04-08 14:30:26] =========================================
[2024-04-08 14:30:26] 📝 详细日志: /var/log/webhook/deploy-2024-04-08-143025.log
[2024-04-08 14:30:26] 📁 查看所有日志: ls -lh /var/log/webhook/
[2024-04-08 14:30:26] 🔍 查看日志: tail -f /var/log/webhook/deploy-2024-04-08-143025.log
[2024-04-08 14:30:26] =========================================
```

**日志配置说明：**

脚本会自动管理日志文件：

```bash
# 日志目录
LOG_DIR="/var/log/webhook"

# 日志文件（自动包含日期时间）
LOG_FILE="/var/log/webhook/deploy-2024-04-08-143025.log"
```

**日志文件示例：**

```
/var/log/webhook/
├── deploy-2024-04-08-143025.log
├── deploy-2024-04-08-151230.log
├── deploy-2024-04-09-092145.log
└── deploy-2024-04-09-103520.log
```

**查看日志：**

```bash
# 查看最新的部署日志
tail -f /var/log/webhook/deploy-$(date '+%Y-%m-%d')*.log

# 查看所有日志文件
ls -lh /var/log/webhook/

# 查看特定日期的日志
cat /var/log/webhook/deploy-2024-04-08-*.log

# 搜索错误
grep -i "error\|fail" /var/log/webhook/*.log
```

### 步骤 5: 创建 systemd 服务

```bash
# 复制服务文件
sudo cp webhook/webhook.service /etc/systemd/system/

# 重新加载 systemd
sudo systemctl daemon-reload

# 启用并启动服务
sudo systemctl enable webhook
sudo systemctl start webhook

# 查看状态
sudo systemctl status webhook
```

### 步骤 6: 配置防火墙

#### 选项 A: UFW

```bash
# 允许 webhook 端口（建议只允许 GitHub IP）
sudo ufw allow from 192.30.252.0/22 to any port 9000
sudo ufw allow from 185.199.108.0/22 to any port 9000
sudo ufw allow from 140.82.112.0/20 to any port 9000
sudo ufw allow from 143.55.64.0/20 to any port 9000
```

#### 选项 B: nftables（推荐）

```bash
# 编辑 nftables 配置
sudo nano /etc/nftables.conf

# 参考 webhook/webhook-nftables.conf 添加规则

# 应用配置
sudo nft -f /etc/nftables.conf
```

---

## 🔧 GitHub 配置

### 步骤 7: 创建 Webhook

1. 打开 GitHub 仓库
2. 进入 `Settings → Webhooks → Add webhook`
3. 填写配置：

```
Payload URL: http://你的服务器IP:9000/hooks/deploy-xingyed-site
Content type: application/json
Secret: 粘贴与 hooks.json 中完全相同的密钥  // ← 必须一致！

SSL verification: Enable SSL verification（如果有 HTTPS）

Which events would you like to trigger this webhook?
  ○ Just the push event.
  ✓ Let me select individual events.
    ✓ Pushes

Active: ✓
```

4. 点击 `Add webhook`

⚠️ **重要提示：**
- GitHub 中的 `Secret` 必须与 `hooks.json` 中的 `secret` **完全一致**
- 如果不一致，签名验证会失败，webhook 将被拒绝
- 建议直接从 `hooks.json` 复制密钥，避免手动输入错误

### 步骤 8: 测试 Webhook

```bash
# 查看 webhook 日志
sudo journalctl -u webhook -f

# 或者查看应用日志
tail -f /var/log/webhook-deploy.log

# 推送代码触发测试
git commit --allow-empty -m "test: trigger webhook deploy"
git push origin main
```

---

## 📊 验证部署

### 检查服务状态

```bash
# 检查 webhook 服务
sudo systemctl status webhook

# 检查 webhook 日志
sudo journalctl -u webhook -n 50

# 检查部署日志
tail -f /var/log/webhook-deploy.log
```

### 测试 webhook 端点

```bash
# 检查 webhook 是否运行
curl http://localhost:9000/hooks/deploy-xingyed-site

# 应该返回 "Deployment started!" 或类似的响应
```

### 手动触发部署

```bash
# 手动执行部署脚本测试
/opt/webhook/scripts/deploy.sh "manual test"

# 检查部署结果
podman-compose ps
curl http://localhost:3000/api/health
```

---

## 🔒 安全建议

### 1. 使用强密码

```bash
# 生成随机密钥（推荐）
openssl rand -hex 32

# 输出示例：
# a3f8b9c2d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0
```

**密钥要求：**
- ✅ 至少 32 字节（64 个十六进制字符）
- ✅ 使用加密安全的随机数生成器
- ✅ 不要在代码中硬编码
- ✅ 定期更换（建议每 3-6 个月）

### 2. 限制 IP 访问

只允许 GitHub 的 IP 范围访问 webhook 端口（见步骤 6）

### 3. 定期更新 GitHub IP

```bash
# 获取最新 GitHub IP 列表
curl -s https://api.github.com/meta | jq '.hooks'
```

### 4. 使用 HTTPS（可选）

```bash
# 使用 Nginx 反向代理
sudo apt install nginx

# 配置 Nginx
sudo nano /etc/nginx/sites-available/webhook

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location /hooks/ {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 启用站点
sudo ln -s /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. 限制 webhook 权限

```bash
# 创建专用用户
sudo useradd -r -s /bin/false webhook-user
sudo chown webhook-user:webhook-user /opt/webhook/scripts/deploy.sh

# 修改 sudoers（允许执行特定命令）
sudo visudo
# 添加：
# webhook-user ALL=(ALL) NOPASSWD: /usr/bin/podman-compose
```

---

## 🔍 故障排查

### Webhook 服务无法启动

```bash
# 查看详细日志
sudo journalctl -u webhook -xe

# 检查配置文件语法
cat /opt/webhook/hooks.json | python3 -m json.tool

# 检查端口是否被占用
sudo lsof -i :9000
```

### 部署失败

```bash
# 查看部署日志
tail -n 100 /var/log/webhook-deploy.log

# 手动执行部署脚本
bash -x /opt/webhook/scripts/deploy.sh "test"

# 检查项目目录权限
ls -la /home/youruser/xingyed.site
```

### GitHub 显示 Webhook 失败

```bash
# 在 GitHub 查看 webhook 投递记录
# Settings → Webhooks → 点击 webhook → Recent Deliveries

# 检查服务器是否能接收外部请求
curl -X POST http://your-server:9000/hooks/deploy-xingyed-site \
  -H "Content-Type: application/json" \
  -d '{"ref": "refs/heads/main"}'
```

### 签名验证失败

```bash
# 检查 secret 是否匹配
# hooks.json 中的 secret 必须与 GitHub webhook 配置一致

# 测试时可以暂时禁用签名验证（不推荐生产环境）
# 修改 hooks.json，删除 trigger-rule 部分
```

---

## 📈 监控和通知

### 添加钉钉通知

在 `scripts/deploy.sh` 中添加：

```bash
# 部署成功通知
send_dingtalk_notification() {
    local status=$1
    curl -X POST 'https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN' \
      -H 'Content-Type: application/json' \
      -d "{
        \"msgtype\": \"text\",
        \"text\": {
            \"content\": \"部署${status}！\n时间: $(date '+%Y-%m-%d %H:%M:%S')\n提交: ${COMMIT_MESSAGE}\"
        }
      }"
}

# 在部署成功/失败时调用
send_dingtalk_notification "成功"
# 或
send_dingtalk_notification "失败"
```

### 添加邮件通知

```bash
# 安装 mailutils
sudo apt install mailutils

# 发送通知
echo "Deployment completed" | mail -s "Deploy Status" your-email@example.com
```

---

## 🧹 日志清理

### 使用清理脚本

脚本会自动清理过期的部署日志文件：

```bash
# 预览模式（默认，不实际删除）
/opt/webhook/scripts/cleanup-logs.sh

# 预览 7 天前的日志
/opt/webhook/scripts/cleanup-logs.sh --days 7

# 实际删除 30 天前的日志
/opt/webhook/scripts/cleanup-logs.sh --days 30 --execute

# 实际删除 7 天前的日志
/opt/webhook/scripts/cleanup-logs.sh --days 7 --execute

# 查看帮助
/opt/webhook/scripts/cleanup-logs.sh --help
```

### 输出示例

**预览模式：**
```
[2024-04-08 15:00:00] =========================================
[2024-04-08 15:00:00] 🧹 日志清理脚本
[2024-04-08 15:00:00] =========================================
[2024-04-08 15:00:00] 📁 日志目录: /var/log/webhook
[2024-04-08 15:00:00] 📅 保留天数: 30 天
[2024-04-08 15:00:00] 🔍 运行模式: 预览模式
[2024-04-08 15:00:00] =========================================
[2024-04-08 15:00:00] 📊 发现 15 个过期日志文件
[2024-04-08 15:00:00] 💾 总大小: 45M
[2024-04-08 15:00:00] =========================================
[2024-04-08 15:00:00] 📋 过期文件列表:
[2024-04-08 15:00:00]   - deploy-2024-03-01-143025.log (2.1M, 2024-03-01)
[2024-04-08 15:00:00]   - deploy-2024-03-02-151230.log (1.8M, 2024-03-02)
...
[2024-04-08 15:00:00] =========================================
[2024-04-08 15:00:00] ⚠️  这是预览模式，文件未被删除
[2024-04-08 15:00:00] 💡 使用 --execute 参数执行实际删除
[2024-04-08 15:00:00] =========================================
```

**执行模式：**
```
[2024-04-08 15:00:00] 🗑️  开始删除过期日志...
[2024-04-08 15:00:00] ✅ 已删除: deploy-2024-03-01-143025.log
[2024-04-08 15:00:00] ✅ 已删除: deploy-2024-03-02-151230.log
...
[2024-04-08 15:00:01] =========================================
[2024-04-08 15:00:01] 📊 清理完成统计
[2024-04-08 15:00:01] =========================================
[2024-04-08 15:00:01] ✅ 成功删除: 15 个文件
[2024-04-08 15:00:01] ❌ 删除失败: 0 个文件
[2024-04-08 15:00:01] =========================================
[2024-04-08 15:00:01] 📁 剩余日志: 8 个文件
[2024-04-08 15:00:01] 💾 剩余大小: 24M
[2024-04-08 15:00:01] =========================================
```

### 配置定时清理

使用 cron 自动清理日志：

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天凌晨 2 点清理 30 天前的日志）
0 2 * * * /opt/webhook/scripts/cleanup-logs.sh --days 30 --execute >> /var/log/webhook/cleanup.log 2>&1

# 每周日凌晨 3 点清理 7 天前的日志（更激进）
0 3 * * 0 /opt/webhook/scripts/cleanup-logs.sh --days 7 --execute >> /var/log/webhook/cleanup.log 2>&1
```

### 手动清理（不推荐）

如果不想使用脚本，也可以手动清理：

```bash
# 查找 30 天前的日志
find /var/log/webhook -name "deploy-*.log" -mtime +30 -type f

# 删除 30 天前的日志
find /var/log/webhook -name "deploy-*.log" -mtime +30 -type f -delete

# 查看剩余日志大小
du -sh /var/log/webhook/
```

⚠️ **建议：** 使用 `cleanup-logs.sh` 脚本而不是手动清理，因为脚本提供了：
- ✅ 预览模式（安全）
- ✅ 详细统计
- ✅ 错误处理
- ✅ 日志记录

## 🎯 最佳实践

1. **始终启用签名验证** - 防止恶意触发
2. **定期备份** - 部署前备份重要数据
3. **使用日志轮转** - 避免日志文件过大
4. **监控磁盘空间** - 定期清理旧镜像
5. **测试环境验证** - 先在测试环境验证 webhook
6. **文档更新** - 保持配置文档最新
7. **密钥管理** - 定期更换 webhook secret

---

## 📚 相关文件

- `hooks.json` - Webhook 配置
- `scripts/deploy.sh` - 部署脚本
- `scripts/cleanup-logs.sh` - 日志清理脚本
- `webhook.service` - systemd 服务配置
- `webhook-ufw.conf` - UFW 防火墙配置
- `webhook-nftables.conf` - nftables 防火墙配置

---

## 🔗 参考资源

- [Adnanh Webhook 文档](https://github.com/adnanh/webhook)
- [GitHub Webhooks 文档](https://docs.github.com/en/webhooks)
- [systemd 服务配置](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
- [nftables 文档](https://wiki.nftables.org/)
