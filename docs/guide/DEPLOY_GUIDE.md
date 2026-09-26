# 部署指南

本文描述本仓库当前的部署方式。**旧文档里基于 GitHub Actions + SSH Secrets 的自动部署方案已废弃**——
云服务器在国内，工作流部署会从境外 IP 出网并频繁触发云告警。

面向 AI 会话的简明版见仓库根目录 [`AGENTS.md`](../../AGENTS.md)。

## 一、两套部署目标

| 目标                     | 地址                         | 说明                                         |
| :----------------------- | :--------------------------- | :------------------------------------------- |
| 自托管（阿里云 + nginx） | `https://xingyed.xyz`        | 功能完整；页脚显示 ICP 备案号                |
| Vercel                   | `https://vercel.xingyed.xyz` | 只读镜像；留言板与登录关闭，页脚不显示备案号 |

两套环境共用同一份代码，差异通过构建期变量控制（见第五节）。

## 二、部署原理

自托管部署只有一条路径：**在开发机构建镜像，推送到生产机加载切换**。

```
开发机                                  生产机（deploy 账户）
──────────────────────────────────      ──────────────────────────────
scripts/deploy/release.sh
  ├─ bun install / app:build
  ├─ 校验 standalone 产物与符号链接
  ├─ 组装构建上下文 → podman build
  ├─ 本地冒烟（/api/health）
  └─ podman save → release-out/*.tar.gz
                    │
scripts/deploy/deploy.sh  │ scp
  └───────────────────────┴──────────→  scripts/deploy/promote.sh
                                          ├─ podman load
                                          ├─ 候选容器验证（3111 端口，不动线上）
                                          ├─ 切换 :current 并重启服务
                                          ├─ 线上巡检，失败自动回滚
                                          └─ 写 RELEASES.log、清理旧版本
```

这样做的三个理由：

1. 生产机访问不了 Docker Hub（国内网络），在本地构建可避免生产机拉基础镜像
2. 上传的是**已经跑通过冒烟测试的镜像**，而不是未经检验的中间产物
3. 发布动作只剩「加载 + 切换 + 巡检」，可回滚、可重复

## 三、前置条件

### 开发机

- Bun 1.3+、Podman 4.0+
- 能通过 SSH 别名 `aliyun-prod-deploy` 连到生产机（密钥登录，定义在 `~/.ssh/config`）
- 仓库位于 `~/workspace/xingyed.site`（脚本按仓库根目录定位，其他路径也可）

### 生产机

- 系统账户结构：`deploy`（应用）、`infra`（基础设施）、`admin`（系统与 nginx）
- `deploy` 已启用 linger，并用 systemd 用户单元运行应用
- `/opt/apps/xingyed-site/.env.production` 存在且权限为 `600 deploy:deploy`

## 四、日常发布

```bash
# 完整发布（构建 + 上传 + 切换 + 巡检）
bash scripts/deploy/deploy.sh

# 复用上次构建产物，只做上传与切换
bash scripts/deploy/deploy.sh --skip-build

# 单独执行某一阶段（promote 在生产机执行）
bash scripts/deploy/release.sh
bash scripts/deploy/promote.sh <镜像包路径> <tag>
```

发布完成后可复核：

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://xingyed.xyz/api/health
curl -s -o /dev/null -w '%{http_code}\n' https://xingyed.xyz/api/guestbook
ssh aliyun-prod-deploy 'tail -3 /opt/apps/xingyed-site/RELEASES.log'
```

## 分支预览环境

线上只跑主干。**合并到 main 之前，请先把分支上到预览自检**——预览与线上同构（同一份镜像构建产物、同一套 nginx），
是合并前最接近真实的验证：

```bash
bash scripts/deploy/preview.sh          # 构建当前分支并发布预览
bash scripts/deploy/preview.sh --down   # 下线预览
```

| 项目     | 值                                                                  |
| :------- | :------------------------------------------------------------------ |
| 访问地址 | `https://preview.xingyed.xyz`（nginx 基础认证）                     |
| 服务单元 | `xingyed-site-preview.service`（Quadlet，监听 `127.0.0.1:3200`）    |
| 镜像标签 | `localhost/xingyed-site:preview`（与 `:current` 完全独立）          |
| 数据库   | `xingyed_site_preview`（独立库，schema 与线上一致）                 |
| 缓存     | 同一 Redis 实例的 **1 号库**（线上用 0 号，避免共用 `blog:all` 键） |
| 环境文件 | `/opt/apps/xingyed-site/.env.preview`（600 deploy:deploy）          |

隔离设计的三个理由：分支可能带未完成的迁移，独立库避免污染线上数据；
共用 Redis 但分库，避免预览写坏线上博客缓存；镜像与 systemd 单元都独立，预览重启不影响线上。

### 为什么需要独立的 vhost

容器与数据隔离解决的是「预览不会影响线上」，但它**不产生入口**：nginx 的配置是
`(监听端口 + SNI/Host) → upstream` 的静态映射，容器跑在 3200 并不会让 nginx 知道它的存在。

若只加 DNS 不加 vhost，请求会落到 443 的**默认 server**（当前是 `api.xingyed.xyz` 的 vhost，
它是配置里第一个 `listen 443 ssl`）。表现为「域名打开了、但显示的是别的东西」——比 502 更难发现，
而且备案号、Cookie 域、缓存策略全都会是另一个站点的。

替代方案与代价：

| 做法                       | 隔离 | 入口                                   | 代价                                                                                             |
| :------------------------- | :--- | :------------------------------------- | :----------------------------------------------------------------------------------------------- |
| 子域 + vhost（本仓库采用） | 等价 | 独立域名，可加基础认证，复用通配符证书 | 一份 nginx 配置 + 一条 DNS                                                                       |
| 复用生产 vhost + 路径前缀  | 等价 | 与生产共用域名                         | Next standalone 资源是绝对路径，需构建期 `basePath`；cookie 域、Cloudflare 缓存、CSP/HSTS 全纠缠 |
| 只开端口 / SSH 隧道        | 等价 | 无域名                                 | 明文或不便于分享；Cloudflare 不代理 3200 这类端口                                                |

结论：要一个**可分享的 HTTPS 入口**就用子域 vhost；只自己在本机 review 则 `ssh -L 3200:127.0.0.1:3200` 即可，
无需 vhost 与 DNS（隔离部分完全一样）。

### 首次搭建步骤

1. 在共享 PostgreSQL 中建库建角色并跑迁移（`xingyed_site_preview`，schema 与线上一致）
2. 写 `/opt/apps/xingyed-site/.env.preview`：以线上 env 为基础，覆盖 `DATABASE_URL`、
   `REDIS_URL`（切到 1 号库）、`BETTER_AUTH_URL`、`BETTER_AUTH_SECRET`
3. 安装 Quadlet 单元 `~/.config/containers/systemd/xingyed-site-preview.container`
   （`Image=...:preview`、`PORT=3200`），然后 `systemctl --user daemon-reload && systemctl --user start xingyed-site-preview.service`
4. 安装 nginx vhost：`scripts/deploy/nginx/preview.xingyed.xyz.conf`，`nginx -t` 后 reload
5. DNS 增加 `preview` 记录指向本机；证书复用现有通配符 `*.xingyed.xyz`，无需新申请

### 预览入口的安装细节

```bash
# 基础认证文件：属主必须是 root:www-data、权限 640，否则 nginx worker 读不到会返回 500
sudo sh -c 'printf "preview:%s\n" "$(openssl passwd -apr1)" > /etc/nginx/.htpasswd-preview'
sudo chown root:www-data /etc/nginx/.htpasswd-preview && sudo chmod 640 /etc/nginx/.htpasswd-preview

# vhost
sudo install -m 644 scripts/deploy/nginx/preview.xingyed.xyz.conf /etc/nginx/sites-available/preview.xingyed.xyz
sudo ln -sfn /etc/nginx/sites-available/preview.xingyed.xyz /etc/nginx/sites-enabled/preview.xingyed.xyz
sudo nginx -t && sudo systemctl reload nginx
```

验证（本机带 SNI 探测，避免命中默认 server）：

```bash
R='--resolve preview.xingyed.xyz:443:127.0.0.1'
curl -sk -o /dev/null -w '%{http_code}\n' $R https://preview.xingyed.xyz/                       # 期望 401
curl -sk -o /dev/null -w '%{http_code}\n' -u 'preview:<密码>' $R https://preview.xingyed.xyz/   # 期望 200
```

### 注意

预览**不接** GitHub 登录，只用于 UI 与接口评审。若将来确实需要，需把
`https://preview.xingyed.xyz/api/auth/callback/github` 加入 GitHub OAuth 应用（因为 `BETTER_AUTH_URL` 指向 preview 域名）。
预览库是空的，留言板初始为空列表属正常。

## 五、环境变量与形态开关

生产配置**不进版本库**，只存在于：

- 生产机 `/opt/apps/xingyed-site/.env.production`（600 deploy:deploy）
- Vercel 项目设置（Production 环境）

仓库里的 `.env.example` 是字段清单。关键键名：

| 分组     | 键                                                                                                          |
| :------- | :---------------------------------------------------------------------------------------------------------- |
| 数据库   | `DATABASE_URL`                                                                                              |
| 缓存     | `REDIS_URL`                                                                                                 |
| 认证     | `BETTER_AUTH_URL`、`BETTER_AUTH_SECRET`                                                                     |
| GitHub   | `APP_ID`、`APP_PEM_KEY_BASE64`、`APP_INSTALLATION_ID`、`AUTH_GITHUB_CLIENT_ID`、`AUTH_GITHUB_CLIENT_SECRET` |
| 邮件     | `SMTP_*`                                                                                                    |
| 形态开关 | `NEXT_PUBLIC_SITE_READONLY`、`NEXT_PUBLIC_ICP_BEIAN`、`NEXT_PUBLIC_SITE_URL`                                |

形态开关的语义：

| 变量                        | 自托管     | Vercel | 效果                                                                              |
| :-------------------------- | :--------- | :----- | :-------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_READONLY` | 不设       | `1`    | 关闭留言板与登录；`/api/guestbook`、`/api/auth/*` 返回 503，`/guestbook` 返回 404 |
| `NEXT_PUBLIC_ICP_BEIAN`     | 构建时注入 | 不设   | 页脚渲染 ICP 备案号                                                               |

注意：`NEXT_PUBLIC_*` 在**构建期内联**，因此：

- 自托管侧由 `release.sh` 在 `bun run app:build` 时注入
- Vercel 侧改完环境变量**必须重新部署**，仅保存设置不生效

## 六、回滚

`promote.sh` 在切换前会记录当前线上镜像 ID，任何巡检失败都会自动打回。手工回滚：

```bash
ssh aliyun-prod-deploy
podman images --format '{{.Repository}}:{{.Tag}} {{.ID}}' | grep xingyed-site
podman tag localhost/xingyed-site:<旧标签> localhost/xingyed-site:current
systemctl --user restart xingyed-site.service
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/api/health
```

版本保留策略：生产机保留最近数个时间戳标签，`:current` 指向线上版本；
早期两个历史标签（Supabase 时代的构建）刻意保留，用于极深回滚。

## 七、日常运维命令

```bash
# 服务状态与日志
systemctl --user status xingyed-site.service
journalctl --user -u xingyed-site.service -n 100 --no-pager

# 容器与端口
podman ps --format '{{.Names}} | {{.Status}} | {{.Ports}}'
ss -tln | grep -E ':(80|443|3000|5432|6379|9000)\b'

# 基础设施：建议直接以 infra 身份登录（职责清晰、审计真实）
ssh aliyun-prod-infra 'systemctl --user status postgres redis minio'
# 或从管理账户临时切换（必须显式指定 XDG_RUNTIME_DIR）
sudo -u infra -H XDG_RUNTIME_DIR=/run/user/$(id -u infra) systemctl --user status postgres redis minio

# nginx
sudo nginx -t && sudo systemctl reload nginx
```

## 八、首次在新机器上部署

1. 按 `AGENTS.md` 的「生产机结构」创建 `deploy` / `infra` 账户，启用 linger
2. 部署 infra 三件套（PostgreSQL / Redis / MinIO），只监听 `127.0.0.1`
3. 在共享 PostgreSQL 中为应用建库建角色，并把迁移跑完
4. 写入 `/opt/apps/xingyed-site/.env.production`（600 deploy:deploy）
5. 安装 Quadlet/用户单元并启动，确认 `http://127.0.0.1:3000/api/health` 返回 200
6. 由 `admin` 配置 nginx vhost，把域名指向 `127.0.0.1:3000`
7. 在开发机 `~/.ssh/config` 配置别名 `aliyun-prod-deploy`（应用）与 `aliyun-prod-infra`（基础设施），然后执行 `bash scripts/deploy/deploy.sh` 完成首次发布

## 九、常见问题

### 接口正常但页面 502 或 404

多半是容器只监听了私网地址。standalone 会用容器内的 `HOSTNAME` 作为监听地址，
若单元里没有显式设置，可能解析成主机名并绑到私网 IP：

```ini
Environment=HOSTNAME=0.0.0.0
```

### 容器启动即退出，日志报 `Cannot find module 'next'`

standalone 的 `node_modules` 全是相对符号链接。若打包产物时改写了链接目标（例如 GNU tar 的
`--transform` 默认会连符号链接目标一起改），链接会失效。`release.sh` 在构建镜像前会显式解析该链接做前置校验。

### 页面里的环境变量没生效

`NEXT_PUBLIC_*` 在构建期内联：改了值必须重新构建，仅重启容器无效。
自托管侧改注入值或环境变量后重新发布；Vercel 侧重新部署。

### 修改 `.env` 后值里带了引号

`podman --env-file` 不解析引号，`KEY="value"` 会把引号写进环境变量；
而 Next 的 dotenv 解析器会剥掉引号。两边行为不一致，统一不要加引号。

### 以其他用户执行 podman 报 `cannot chdir`

`sudo -u <user>` 会继承当前工作目录。若当前目录是 `0700` 且目标用户无权进入，podman 会直接失败。
脚本里应显式 `cd /`。

### Vercel 部署失败

先看 Vercel 后台的构建日志，并确认三项：Root Directory 为 `apps/app`、Build Command 为
`bun run build`、Node 版本与项目匹配。注意 Vercel 用 **commit status** 上报部署，
GitHub 的 Deployments API 里可能查不到。

### 只读镜像上留言板应该报错吗

应该。Vercel 侧 `/api/guestbook` 与 `/api/auth/*` 返回 503、`/guestbook` 返回 404 是设计行为；
自托管侧同样接口应返回 200。
