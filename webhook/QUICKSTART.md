# Webhook 快速开始指南

## 🚀 5 分钟快速配置

### 1. 安装 Webhook

```bash
sudo apt install webhook
```

### 2. 创建配置

```bash
sudo mkdir -p /opt/webhook/scripts
sudo cp webhook/hooks.json /opt/webhook/
sudo cp webhook/scripts/deploy.sh /opt/webhook/scripts/
sudo chmod +x /opt/webhook/scripts/deploy.sh
```

### 3. 生成 Secret 并修改配置

#### 3.1 生成 Webhook Secret

使用 OpenSSL 生成安全的随机密钥：

```bash
# 生成 32 字节的随机密钥（64 个十六进制字符）
openssl rand -hex 32

# 输出示例：
# a3f8b9c2d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0
```

复制输出的密钥，后面会用到。

#### 3.2 修改 hooks.json

编辑 `/opt/webhook/hooks.json`：

```bash
sudo nano /opt/webhook/hooks.json
```

需要修改两个地方：

1. **command-working-directory** - 改为你的项目路径
2. **secret** - 改为刚才生成的密钥

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

#### 3.3 修改 deploy.sh

编辑 `/opt/webhook/scripts/deploy.sh`：

```bash
sudo nano /opt/webhook/scripts/deploy.sh
```

修改项目路径：

```bash
PROJECT_DIR="/home/你的用户名/xingyed.site"  # ← 修改为你的项目路径

### 4. 启动服务

```bash
sudo cp webhook/webhook.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now webhook
```

### 5. 配置 GitHub

```
Settings → Webhooks → Add webhook

Payload URL: http://你的服务器IP:9000/hooks/deploy-xingyed-site
Content type: application/json
Secret: 粘贴与 hooks.json 中相同的密钥  // ← 必须与 hooks.json 中的 secret 完全一致
Events: ✓ Pushes
Active: ✓
```

⚠️ **重要：** GitHub 中配置的 Secret 必须与 `hooks.json` 中的 `secret` 完全一致，否则签名验证会失败！

### 6. 测试

```bash
# 推送代码触发
git commit --allow-empty -m "test: webhook deploy"
git push origin main

# 查看日志（脚本会显示日志位置）
# 日志文件示例: /var/log/webhook/deploy-2024-04-08-143025.log

# 查看今天的日志
tail -f /var/log/webhook/deploy-$(date '+%Y-%m-%d')*.log

# 查看所有日志文件
ls -lh /var/log/webhook/
```


---

## ⚡ 常用命令

```bash
# 查看服务状态
sudo systemctl status webhook

# 重启服务
sudo systemctl restart webhook

# 查看 webhook 服务日志
sudo journalctl -u webhook -f

# 查看部署日志（最新的）
tail -f /var/log/webhook/deploy-$(date '+%Y-%m-%d')*.log

# 查看所有日志文件
ls -lh /var/log/webhook/

# 查看特定日期的日志
cat /var/log/webhook/deploy-2024-04-08-*.log

# 手动测试部署
/opt/webhook/scripts/deploy.sh "manual test"

# 清理日志（预览模式）
/opt/webhook/scripts/cleanup-logs.sh

# 清理日志（执行模式）
/opt/webhook/scripts/cleanup-logs.sh --days 30 --execute

# 检查端口
sudo lsof -i :9000
```

---

## 🔧 配置文件说明

| 文件 | 用途 | 位置 |
|------|------|------|
| `hooks.json` | Webhook 配置 | `/opt/webhook/` |
| `deploy.sh` | 部署脚本 | `/opt/webhook/` |
| `webhook.service` | systemd 服务 | `/etc/systemd/system/` |

---

## 📖 详细文档

查看 [README.md](./README.md) 获取完整配置指南。
