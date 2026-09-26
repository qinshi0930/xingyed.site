# 部署

主站有两套部署目标，职责完全不同，不要混用：

| 目标                     | 用途                               | 触发方式                                  |
| ------------------------ | ---------------------------------- | ----------------------------------------- |
| 自托管（阿里云 + nginx） | 主站生产环境 `https://xingyed.xyz` | 本文档描述的脚本，由 Codex 在本机执行     |
| Vercel                   | 外网访问入口                       | Vercel 平台自动构建，`vercel.json` 为配置 |

自托管环境**不使用 GitHub Actions 部署**。云服务器在国内，工作流部署会从境外 IP 出网，频繁触发阿里云告警。

## 部署流水线

```
开发机                                  生产机（deploy 用户）
──────────────────────────────────      ────────────────────────────────
release.sh
  ├─ bun install / app:build
  ├─ 校验 standalone 产物与符号链接
  ├─ 组装构建上下文并 podman build
  ├─ 本地冒烟（/api/health）
  └─ podman save → release-out/*.tar.gz
                    │
deploy.sh           │ scp
  └─────────────────┴────────────────→  promote.sh
                                          ├─ podman load
                                          ├─ 候选容器验证（3111 端口，不动线上）
                                          ├─ 切换 :current 并重启 xingyed-site.service
                                          ├─ 线上巡检，失败自动回滚上一个镜像
                                          └─ 记录 RELEASES.log、清理旧版本
```

## 用法

在开发机的仓库根目录执行：

```bash
# 完整发布（构建 + 上传 + 切换 + 巡检）
bash scripts/deploy/deploy.sh

# 复用上次构建产物，只做上传与切换
bash scripts/deploy/deploy.sh --skip-build

# 单独执行某一阶段
bash scripts/deploy/release.sh
bash scripts/deploy/promote.sh   # 这一步在生产机执行
```

## 约定

- **镜像标签**：`<YYYYMMDDHHMM>-<git-short-sha>`；工作区不干净时追加 `-dirty`。生产机保留最近 5 个版本，`:current` 指向线上版本。
- **回滚**：promote.sh 在切换前记录原镜像 ID。若线上巡检失败，自动 `podman tag <prev> :current` 并重启。手工回滚同理——把某个历史标签重新打成 `:current` 再重启单元即可。
- **发布记录**：生产机 `/opt/apps/xingyed-site/RELEASES.log`。
- **环境变量**：生产机 `/opt/apps/xingyed-site/.env.production`（600，deploy:deploy），不进入版本库。key 列表见 `.env.example`。
- **SSH 别名**：`aliyun-prod-deploy` 定义在开发机 `~/.ssh/config`，对应生产机 `deploy@101.132.156.78:6622`。

## 分支预览环境

用于 review 分支版本：把当前检出构建成镜像，部署到生产机的 3200 端口，**不影响线上**。

```bash
bash scripts/deploy/preview.sh              # 当前分支 → 预览
bash scripts/deploy/preview.sh --skip-build # 复用上次构建产物
bash scripts/deploy/preview.sh --down       # 下线预览（停服务 + 删 :preview 镜像）
```

- 访问地址：`https://preview.xingyed.xyz`（nginx 基础认证，配置见 `scripts/deploy/nginx/preview.xingyed.xyz.conf`）
- 隔离：独立数据库 `xingyed_site_preview` + Redis **1 号库**，与线上数据、缓存互不干扰
- 镜像：`:preview` 独立标签，切换只重启 `xingyed-site-preview.service`
- 首次搭建见 [`docs/guide/DEPLOY_GUIDE.md`](../../docs/guide/DEPLOY_GUIDE.md) 的「分支预览环境」

## 构建产物的坑（务必保留 release.sh 中的校验）

Next.js standalone 的 `node_modules` 全是相对符号链接，例如：

```
apps/app/node_modules/next -> ../../../node_modules/.bun/next@15.5.9+.../node_modules/next
```

一旦打包方式改写了链接目标（GNU tar 的 `--transform` 默认会连符号链接目标一起改），链接就会失效，镜像能构建成功但运行时直接 `Cannot find module 'next'`。release.sh 因此在构建镜像前显式解析该链接做前置校验。

同理，组装构建上下文时必须先建好 `.next/` 目录再 `cp -a`——`cp -a src/dir DEST/` 的落地名是 `dir` 而不是 `src/dir`。
