# 🚀 自动部署快速配置

## 3 步完成自动部署配置

### 步骤 1: 生成 SSH 密钥（服务器）

```bash
# 在服务器上执行
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions -N ""

# 查看公钥
cat ~/.ssh/github_actions.pub

# 添加到授权列表
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 步骤 2: 配置 GitHub Secrets

进入：`GitHub 仓库 → Settings → Secrets and variables → Actions`

添加 3 个 Secrets：

| Secret | 值 | 示例 |
|--------|-----|------|
| `SSH_HOST` | 服务器IP | `123.45.67.89` |
| `SSH_USER` | 用户名 | `root` 或 `ubuntu` |
| `SSH_PRIVATE_KEY` | 私钥内容 | `cat ~/.ssh/github_actions` |

**获取私钥：**
```bash
# 在服务器上执行，复制完整输出
cat ~/.ssh/github_actions
```

### 步骤 3: 修改部署路径

编辑 `.github/workflows/deploy.yml`：

```yaml
env:
  PROJECT_PATH: /home/youruser/xingyed.site  # 改成你的实际路径
```

## ✅ 测试部署

```bash
# 推送代码触发自动部署
git add .
git commit -m "test: auto deploy"
git push origin main
```

## 📊 查看部署状态

1. 打开 GitHub 仓库
2. 点击 `Actions` 标签
3. 查看 `Deploy to Server` 运行状态
4. 点击看详细日志

## 🎯 部署流程

```
git push → GitHub Actions → SSH 到服务器 → 自动部署
                                    ↓
                            1. git pull
                            2. podman-compose down
                            3. podman-compose up -d --build
                            4. 健康检查
                                    ↓
                              ✅ 部署完成！
```

## 🔧 可选：启用健康检查

在应用添加健康检查 API：

```typescript
// apps/app/src/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
```

## ⚠️ 常见问题

**Q: SSH 连接失败？**
```bash
# 测试 SSH 连接
ssh -i ~/.ssh/github_actions your_user@your_server
```

**Q: 部署脚本报错？**
```bash
# 在服务器手动执行
cd /path/to/project
podman-compose up -d --build
podman-compose logs -f
```

**Q: 权限问题？**
```bash
# 确保 SSH 权限正确
chmod 700 ~/.ssh
chmod 600 ~/.ssh/github_actions
chmod 600 ~/.ssh/authorized_keys
```

## 📖 详细文档

查看 [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) 获取完整配置指南。
