# AGENTS.md

本文件面向上手这个仓库的 AI 会话与协作者，说明**部署怎么做**以及**哪些约束不能违反**。
人类向的完整说明见 [`docs/guide/DEPLOY_GUIDE.md`](docs/guide/DEPLOY_GUIDE.md)，速查见
[`docs/guide/AUTO_DEPLOY_QUICKSTART.md`](docs/guide/AUTO_DEPLOY_QUICKSTART.md)。

## 项目是什么

- Bun monorepo，主应用在 `apps/app`（Next.js 15 App Router + Hono API 同构，输出 standalone）
- 两套部署目标：
  - **自托管**（阿里云 + nginx）→ `https://xingyed.xyz`，功能完整
  - **Vercel** → `https://vercel.xingyed.xyz`，只读镜像（留言板与登录关闭）
- 数据：共享 infra 服务的 PostgreSQL / Redis / MinIO；主应用独占数据库 `xingyed_site`

## 部署：唯一入口

在**开发机**的仓库根目录执行。脚本会完成构建、上传、候选验证、切换、巡检与失败回滚：

```bash
bash scripts/deploy/deploy.sh               # 完整发布
bash scripts/deploy/deploy.sh --skip-build  # 复用上次构建产物
```

- 运行手册：[`scripts/deploy/README.md`](scripts/deploy/README.md)
- 生产机连接：开发机 `~/.ssh/config` 里的两个别名——`aliyun-prod-deploy`（应用，deploy 账户）与 `aliyun-prod-infra`（基础设施，infra 账户），均为仅密钥登录。
  真实主机、端口与用户见仓库根目录 `.env.ops`（已 gitignore，不入库），
  键名与用法见文末「生产机连接信息」
- 发布记录：生产机 `/opt/apps/xingyed-site/RELEASES.log`

## 不可违反的约束

1. **不要用 GitHub Actions 部署**。云服务器在国内，工作流部署会从境外 IP 出网并频繁触发云告警。
   CI 只做 lint 与类型检查（`code-quality`）。
2. **不要直推 main**。仓库的 pre-push 钩子会拒绝，必须走「分支 → PR → squash 合并」。
3. **不要在仓库里提交任何密钥**。生产配置只存在于生产机的
   `/opt/apps/xingyed-site/.env.production`（600 deploy:deploy）与 Vercel 项目设置中；仓库只有 `.env.example`。
4. **改动 `NEXT_PUBLIC_*` 相关行为后必须重新构建**。这类变量在构建期内联，仅重启不生效
   （自托管与 Vercel 同理）。
5. **Vercel 侧不要设置 `DATABASE_URL` / `REDIS_URL`**。只读镜像不连数据库；
   Redis 未配置时客户端会自动降级为读文件系统。

## 环境形态开关

同一套代码服务两种部署形态，差异靠构建期变量控制，实现位置在
`apps/app/src/common/constant/site.ts`：

| 变量                        | 自托管                                | Vercel | 作用                                                                                            |
| :-------------------------- | :------------------------------------ | :----- | :---------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_READONLY` | 不设                                  | `1`    | 关闭留言板与登录：`/api/guestbook`、`/api/auth/*` 返回 503，`/guestbook` 返回 404，导航隐藏入口 |
| `NEXT_PUBLIC_ICP_BEIAN`     | 构建时注入（`release.sh` 内有默认值） | 不设   | 页脚是否渲染 ICP 备案号                                                                         |

## 生产机结构（自托管）

| 账户     | 职责       | 说明                                                 |
| :------- | :--------- | :--------------------------------------------------- |
| `admin`  | 系统与入口 | sudo、nginx、防火墙                                  |
| `deploy` | 应用       | `/opt/apps/<app>`、systemd 用户单元、无 sudo         |
| `infra`  | 基础设施   | PostgreSQL / Redis / MinIO，Quadlet 单元，仅密钥登录 |

- 应用与 infra 只监听 `127.0.0.1`；对外只有 nginx 的 80/443
- 应用容器使用 `Network=host`，因此 `127.0.0.1:5432` 就是宿主机的数据库地址
- 路径约定：`/opt/apps/<app>/.env.production`、`/opt/infra/env/`、`/opt/infra/redis.conf`

## 回滚

`deploy.sh` 在切换前记录原镜像，巡检失败会自动回滚。手工回滚：

```bash
ssh aliyun-prod-deploy
podman images | grep xingyed-site             # 找到上一版标签
podman tag localhost/xingyed-site:<旧标签> localhost/xingyed-site:current
systemctl --user restart xingyed-site.service
```

## 验证命令

```bash
# 生产机本机
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/api/health
systemctl --user is-active xingyed-site.service
journalctl --user -u xingyed-site.service -n 50 --no-pager

# 公网（开发机）
curl -s -o /dev/null -w '%{http_code}\n' https://xingyed.xyz/api/health
curl -s -o /dev/null -w '%{http_code}\n' https://vercel.xingyed.xyz/api/health
```

## 已知的坑

- `podman --env-file` 不解析引号：`.env` 的值不要加外层引号，否则容器里会拿到带引号的字符串
- `sudo -u <user>` 会继承当前工作目录；在 `0700` 目录下执行会让 podman 报 `cannot chdir`，脚本内先 `cd /`
- rootless 容器的镜像存储按用户隔离：迁移镜像必须显式 `podman save` / `podman load`
- 删除账户后会有目录壳与 `/tmp` 残留，需按 uid 复查（`find / -xdev -uid <uid>`）
- 更多见 [`docs/guide/DEPLOY_GUIDE.md`](docs/guide/DEPLOY_GUIDE.md) 的「常见问题」一节

## 生产机连接信息

本文刻意不写真实主机与端口——本仓库是公开仓库。真实值放在**仓库根目录的 `.env.ops`**，
该文件被 `.gitignore` 的 `.env*` 规则忽略，不会提交：

命名约定：**[服务商]-[环境]-[角色]**（例如 `aliyun-prod-deploy`），便于以后接入其它云服务商时扩展。

```dotenv
ALIYUN_PROD_SSH_HOST=<生产机域名或 IP>
ALIYUN_PROD_SSH_PORT=<SSH 端口>

# 应用部署（deploy 账户）
ALIYUN_PROD_DEPLOY_USER=deploy
ALIYUN_PROD_DEPLOY_ALIAS=aliyun-prod-deploy
ALIYUN_PROD_DEPLOY_KEY=~/.ssh/aliyun-prod-deploy

# 基础设施（infra 账户，独立密钥）
ALIYUN_PROD_INFRA_USER=infra
ALIYUN_PROD_INFRA_ALIAS=aliyun-prod-infra
ALIYUN_PROD_INFRA_KEY=~/.ssh/aliyun-prod-infra

# 生产机路径约定
ALIYUN_PROD_APP_DIR=/opt/apps/xingyed-site
ALIYUN_PROD_ENV_FILE=/opt/apps/xingyed-site/.env.production
ALIYUN_PROD_RELEASES_LOG=/opt/apps/xingyed-site/RELEASES.log
ALIYUN_PROD_INFRA_ENV_DIR=/opt/infra/env
```

- 同一台开发机上的 AI 会话可直接读取 `.env.ops` 取这些值；仓库里只保留**键名**
- 换新机器时按上述键名重建该文件，并在 `~/.ssh/config` 里配好两个别名
- 命令一律通过别名引用生产机：`ssh aliyun-prod-deploy`（应用）/ `ssh aliyun-prod-infra`（基础设施）
- 两个角色使用**独立密钥**：任一密钥泄露不会连带另一个账户
