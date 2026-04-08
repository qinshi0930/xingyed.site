# GitHub Actions 自动部署配置指南

## 📋 概述

本指南介绍如何配置 GitHub Actions 实现推送到 main 分支时自动部署到服务器。

## 🔧 配置步骤

### 1. 服务器准备

#### 1.1 生成 SSH 密钥对

```bash
# 在服务器上执行
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions -N ""

# 查看公钥（需要添加到 GitHub）
cat ~/.ssh/github_actions.pub

# 查看私钥（需要添加到 GitHub Secrets）
cat ~/.ssh/github_actions
```

#### 1.2 配置 SSH 授权密钥

```bash
# 将公钥添加到 authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# 设置正确的权限
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/github_actions
```

### 2. GitHub 配置

#### 2.1 添加 Secrets

进入仓库：`Settings → Secrets and variables → Actions → New repository secret`

添加以下 Secrets：

| Secret 名称 | 值 | 说明 |
|------------|-----|------|
| `SSH_HOST` | `your.server.ip` | 服务器 IP 地址或域名 |
| `SSH_USER` | `your_username` | SSH 登录用户名 |
| `SSH_PRIVATE_KEY` | `-----BEGIN...` | 服务器生成的私钥内容 |

#### 2.2 添加方式

```bash
# 方式 1：通过 GitHub Web 界面
Settings → Secrets and variables → Actions → New repository secret

# 方式 2：通过 GitHub CLI
gh secret set SSH_HOST -b"your.server.ip"
gh secret set SSH_USER -b"your_username"
gh secret set SSH_PRIVATE_KEY < ~/.ssh/github_actions
```

### 3. 配置部署脚本

#### 3.1 修改项目路径

编辑 `.github/workflows/deploy.yml` 或 `deploy-advanced.yml`：

```yaml
env:
  PROJECT_PATH: /home/youruser/xingyed.site  # 修改为实际路径
```

#### 3.2 选择 Workflow 文件

- **deploy.yml** - 简单版本，适合快速部署
- **deploy-advanced.yml** - 高级版本，包含健康检查和详细日志

重命名你想要的文件为 `deploy.yml`：

```bash
# 使用简单版本
mv .github/workflows/deploy.yml .github/workflows/deploy.yml

# 或使用高级版本
mv .github/workflows/deploy-advanced.yml .github/workflows/deploy.yml
```

### 4. 测试部署

#### 4.1 手动触发

```bash
# 推送代码触发部署
git add .
git commit -m "test: trigger auto deploy"
git push origin main
```

#### 4.2 查看部署状态

1. 进入 GitHub 仓库
2. 点击 `Actions` 标签
3. 查看 `Deploy to Server` workflow 运行状态
4. 点击运行查看详情和日志

### 5. 高级配置

#### 5.1 添加健康检查端点

在应用中添加健康检查 API（如果还没有）：

```typescript
// apps/app/src/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}
```

#### 5.2 配置部署通知

在 workflow 中添加通知（可选）：

```yaml
# 钉钉通知
- name: 📢 钉钉通知
  if: always()
  run: |
    curl -X POST 'https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN' \
      -H 'Content-Type: application/json' \
      -d '{
        "msgtype": "text",
        "text": {
          "content": "部署${{ job.status == 'success' && '成功' || '失败' }}！"
        }
      }'

# 飞书通知
- name: 📢 飞书通知
  if: always()
  run: |
    curl -X POST 'https://open.feishu.cn/open-apis/bot/v2/hook/YOUR_TOKEN' \
      -H 'Content-Type: application/json' \
      -d '{
        "msg_type": "text",
        "content": {
          "text": "部署${{ job.status == 'success' && '成功' || '失败' }}！"
        }
      }'
```

#### 5.3 配置构建测试后再部署

修改 `deploy.yml`：

```yaml
jobs:
  deploy:
    needs: [build-test]  # 等待 build-test 成功后再部署
```

### 6. 故障排查

#### 6.1 SSH 连接失败

```bash
# 在本地测试 SSH 连接
ssh -i ~/.ssh/github_actions your_user@your_server

# 检查服务器 SSH 配置
cat /etc/ssh/sshd_config | grep -E "PubkeyAuthentication|AuthorizedKeysFile"
```

#### 6.2 部署脚本报错

```bash
# 在服务器上手动执行部署脚本
cd /path/to/project
git pull origin main
podman-compose down
podman-compose up -d --build

# 查看日志
podman-compose logs -f
```

#### 6.3 权限问题

```bash
# 确保 SSH 密钥权限正确
chmod 700 ~/.ssh
chmod 600 ~/.ssh/github_actions
chmod 600 ~/.ssh/authorized_keys

# 确保用户有 podman 权限
usermod -aG podman your_user
```

## 📊 部署流程

```
开发者 push 代码到 main
    ↓
GitHub Actions 自动触发
    ↓
通过 SSH 连接到服务器
    ↓
执行部署脚本：
  1. git pull（拉取最新代码）
  2. podman-compose down（停止旧容器）
  3. podman-compose up -d --build（构建并启动新容器）
  4. 健康检查（验证服务正常）
    ↓
部署完成，发送通知
```

## 🎯 最佳实践

1. **使用非 root 用户** - 创建专门的部署用户
2. **启用 SSH 密钥认证** - 禁用密码登录
3. **定期清理旧镜像** - 避免磁盘空间不足
4. **添加健康检查** - 确保部署成功
5. **配置通知** - 及时了解部署状态
6. **备份数据** - 部署前备份重要数据
7. **灰度发布** - 重要更新先在测试环境验证

## 🔒 安全建议

1. 使用最小权限的 SSH 密钥
2. 定期轮换 SSH 密钥
3. 不要在代码中硬编码密钥
4. 使用 GitHub Secrets 管理敏感信息
5. 限制 Actions 的权限范围
6. 启用 GitHub 的分支保护

## 📚 相关资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [appleboy/ssh-action](https://github.com/appleboy/ssh-action)
- [Podman 文档](https://docs.podman.io/)
