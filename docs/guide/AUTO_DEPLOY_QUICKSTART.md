# 部署速查

完整说明见 [`DEPLOY_GUIDE.md`](DEPLOY_GUIDE.md)；面向 AI 会话的版本见 [`AGENTS.md`](../../AGENTS.md)。

## 一条命令发布

```bash
# 在开发机的仓库根目录执行
bash scripts/deploy/deploy.sh
```

脚本自动完成：构建 → 本地冒烟 → 上传 → 候选容器验证 → 切换 `:current` → 重启服务 →
线上巡检 → 失败自动回滚 → 写发布记录。

## 发布后检查

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://xingyed.xyz/api/health         # 期望 200
curl -s -o /dev/null -w '%{http_code}\n' https://xingyed.xyz/api/guestbook      # 期望 200
curl -s -o /dev/null -w '%{http_code}\n' https://vercel.xingyed.xyz/api/health  # 期望 200
ssh xingyed-prod 'tail -3 /opt/apps/xingyed-site/RELEASES.log'
```

## 出问题怎么办

```bash
# 1) 看线上日志
ssh xingyed-prod 'journalctl --user -u xingyed-site.service -n 80 --no-pager'

# 2) 回滚到上一版
ssh xingyed-prod
podman images --format '{{.Repository}}:{{.Tag}}' | grep xingyed-site
podman tag localhost/xingyed-site:<上一版标签> localhost/xingyed-site:current
systemctl --user restart xingyed-site.service
```

## 四条铁律

1. 不用 GitHub Actions 部署（境外 IP 会触发云告警），CI 只跑 lint 与类型检查
2. 不直推 main（pre-push 钩子会拦），走分支 + PR + squash
3. 密钥不入库，只在生产机的 `.env.production` 与 Vercel 设置里
4. `NEXT_PUBLIC_*` 改完必须重新构建，重启不生效

## 两种部署形态

|             | 自托管 `xingyed.xyz`       | Vercel `vercel.xingyed.xyz` |
| :---------- | :------------------------- | :-------------------------- |
| 定位        | 功能完整                   | 只读镜像                    |
| 留言板/登录 | 可用                       | 关闭（503 / 404）           |
| ICP 备案号  | 页脚显示                   | 不显示                      |
| 部署方式    | `scripts/deploy/deploy.sh` | 推送 main 后自动构建        |
