# 代码层精简设计

> 状态：草案 · 待 review
> 日期：2026-05-17
> 范围：`apps/app/src` + `apps/app/scripts` + `packages/types` + `packages/utils`

## 1. 背景

随着同构架构、Guestbook、Projects、Dashboard 等模块陆续上线，源码中累积了一些被注释掉的代码块、调试痕迹与历史豁免。这些内容不影响运行时行为，但会增加阅读负担、降低 AI 协作的上下文质量，并掩盖真正有意义的注释。

本设计针对一次"代码层精简"任务，确立标准范围、工作流与验收标准，作为本次以及未来同类清理任务的参照。

## 2. 目标与非目标

### 目标

- 在不改变运行时行为的前提下，移除 monorepo TypeScript 源码中的死代码块与调试痕迹
- 与项目既有规范「代码层精简范围规范」对齐
- 为后续质量基线建设（lint 守门、dead export 扫描）保留清晰的接口

### 非目标

- 不修改任何用户可见的文案、UI 行为、API 契约
- 不删除任何 `export` 的符号（dead export 属于 Future Work）
- 不动 `.mdx` 文章内容、配置文件、CI 工作流

## 3. 范围矩阵

### 3.1 清理分类（基线）

| 编号  | 含义                                      | 处理                     | 实际命中                                                                                                         |
| ----- | ----------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **a** | 被注释掉的代码块                          | 直接删                   | ≥ 5 处（dashboard / about / blog / projects 等模块）                                                             |
| **b** | 未使用的 `import`                         | 直接删                   | 几乎为 0（ESLint `unused-imports/no-unused-imports: error` 已守住），实际靶点是 7 处文件级 `eslint-disable` 豁免 |
| **e** | 调试痕迹（裸 `console.log` / `debugger`） | 直接删                   | `apps/app/src` 内 0 处；脚本目录的进度输出视为有意保留                                                           |
| **f** | 过期 TODO/FIXME/XXX/HACK                  | 删除（本次空载，无靶点） | 全范围 0 处                                                                                                      |
| **i** | 注释掉的钩子/监听 / `useEffect`           | 直接删                   | 在 a 类清理过程中顺手处理                                                                                        |

### 3.2 默认保留（不动）

- 解释性注释（说明"为什么这么写"的知识型注释）
- `console.error` / `console.warn` 与刻意保留的诊断日志
- 部署脚本（`apps/app/scripts/deploy-local.ts` 等）的进度 `console.log` —— 是脚本对用户的输出，非调试痕迹

### 3.3 扫描范围

包含：

- `apps/app/src/**/*.{ts,tsx}`
- `apps/app/scripts/**/*.ts`
- `packages/types/**/*.ts`
- `packages/utils/**/*.ts`

排除：

- 产物：`node_modules/`、`.next/`、`dist/`、`apps/app/dist/`
- 资源：`apps/app/public/`
- 文档与工作流：`docs/`、`openspec/`、`.qoder/`、`.opencode/`、`.github/workflows/`
- 根配置：`next.config.ts`、`drizzle.config.ts`、`postcss.config.mjs`、`eslint.config.mjs`、`stylelint.config.mjs`、`tsconfig.json` 等
- 历史/锁文件：`*.bak`、`bun.lock`
- 内容文件：`apps/app/src/contents/blog/**.mdx`
- 暂不纳入本次：`webhook/`、顶层 `scripts/`（理由：`webhook` 现代化改造在进行中，顶层 `scripts` 多为脚本输出而非源码）

## 4. 工作流

```
1. 切分支：chore/code-cleanup
2. 全量精确扫描，生成清单 markdown（路径 + 行号 + 片段 + git blame）
3. 同步点 ①：用户 review 清单，可对任意条目主动豁免
4. 按目录批量删除，每个目录一个 commit
5. 每个 commit 后跑：bun run build && bun run lint && bunx tsc --noEmit
6. 视觉冒烟测试 7 个主要页面
7. 推送分支 → 创建 PR，PR 描述附清单 markdown 作审计证据
8. 同步点 ②：用户 review PR 后合并
```

## 5. Commit 切分策略

按 `apps/app/src` 子目录分批，每个 commit 独立可回滚，命名遵循中文 commit 规范（type 英文 + 描述中文）：

| Commit                                       | 路径                                        | 内容                       | 是否必出 |
| -------------------------------------------- | ------------------------------------------- | -------------------------- | -------- |
| `chore: 清理 app 路由层注释代码块`           | `apps/app/src/app/**`                       | dashboard/page.tsx 等      | 是       |
| `chore: 清理 modules 注释代码块`             | `apps/app/src/modules/**`                   | about / blog / projects 等 | 是       |
| `chore: 清理 common/services 注释代码块`     | `apps/app/src/common/**`、`src/services/**` | 其它源码                   | 是       |
| `chore: 审视并精简 eslint-disable 豁免`      | 7 处文件级豁免                              | 单独 commit，便于 review   | 是       |
| `chore: 清理 packages 与 scripts 注释代码块` | `packages/**`、`apps/app/scripts/**`        | 仅在扫描发现靶点时出现     | 条件     |

**eslint-disable 豁免审视标准**：移除豁免后跑 `bun run lint`——若无新错则保留移除；若有新错，则把豁免范围尽量收窄（如从 `/* eslint-disable */` 改为 `// eslint-disable-next-line`）并在注释中追加保留原因。

## 6. 与用户的同步点

- **同步点 ①（清单 review）**：扫描清单生成后由用户过一遍，标注"主动豁免"项。豁免理由记入 PR 描述
- **同步点 ②（PR review）**：所有 commit 完成、本地验证通过后，由用户 review PR 合并

## 7. 验收标准（DoD）

- [ ] 所有 a / i 类注释代码块在扫描范围内清零（除主动豁免）
- [ ] 7 处文件级 `eslint-disable unused-imports/*` 经过审视，能去掉的去掉，需保留的写明原因
- [ ] `bun run build` 通过
- [ ] `bun run lint` 通过（无新增 warning）
- [ ] `bunx tsc --noEmit` 通过
- [ ] 7 个主要页面（`/`、`/about`、`/blog`、`/projects`、`/dashboard`、`/learn`、`/contact`、`/guestbook`）冒烟通过：控制台无报错、渲染正常、Dashboard 贡献图正常加载
- [ ] PR 描述附完整清单 markdown，标注每条处理动作

## 8. 验证策略

```
本地验证（每个 commit 之后）：
├─ bun run build
├─ bun run lint
└─ bunx tsc --noEmit

CI 验证（PR 推送后）：
├─ GitHub Actions 既有 build / lint / typecheck workflow
└─ Vercel preview 部署（如启用）

人工冒烟（PR 合并前，本地 dev 启动）：
└─ 访问 7 个主要页面观察控制台与渲染
```

## 9. 风险与缓解

| ID  | 风险                                    | 概率 | 影响 | 缓解                                                      |
| --- | --------------------------------------- | ---- | ---- | --------------------------------------------------------- |
| R1  | 注释代码块实际是"暂存待恢复"            | 低   | 中   | 同步点 ① 由用户 review；git history 永久可查              |
| R2  | 去掉 `eslint-disable` 后报新 lint error | 中   | 低   | 每个 commit 后跑 lint，失败立刻补回豁免并附原因注释       |
| R3  | 删除内容与 OpenSpec 文档存在引用        | 低   | 低   | 清单生成时附 git blame；OpenSpec changes 目录不在扫描范围 |
| R4  | 视觉冒烟漏掉次要页面                    | 低   | 低   | 因零行为变化，理论上不会有视觉 regression                 |
| R5  | 单 PR 体量过大 review 困难              | 中   | 低   | 已通过"按目录拆 commit"缓解；PR 内逐 commit 审            |

## 10. Future Work

- **F1：质量基线 lint 守门** — 在 ESLint 中开启 `no-warning-comments`、`no-console`（针对 `apps/app/src`）、`no-debugger`，把"清理"转化为"预防"
- **F2：dead export 扫描** — 引入 `knip` 或 `ts-prune`，处理本次未涵盖的未引用 export / 孤儿文件，需解决同构 API/SSR 边界的误判
- **F3：scripts 与 webhook 目录的清理** — 当那些目录稳定后，按本设计同一套范围矩阵走一次清理

## 11. 决策记录

本次设计在 brainstorming 阶段做出的关键决策：

| 决策          | 选项                                          | 结果              | 依据                                  |
| ------------- | --------------------------------------------- | ----------------- | ------------------------------------- |
| 精简层次      | A 文件级 / B 文案级 / C 功能级 / **D 全站级** | D                 | 用户选择                              |
| 收敛 D 的范围 | 全站功能裁剪 → **全站代码层**                 | 代码层            | 用户后续澄清                          |
| 清理分类基线  | a + b + e + i → **+ f**                       | a + b + e + f + i | 与既有规范「代码层精简范围规范」对齐  |
| 扫描范围      | ①+②+③+...+⑦                                   | **①+②+③**         | 源码优先策略                          |
| 执行方案      | A 一刀流 / **B 按风险分阶段** / C 工具优先    | B                 | 确定性与争议性分离                    |
| Phase 2 处置  | **① 取消** / ② 改 lint 守门 / ③ 扩大扫描      | ① 取消            | 全范围零 TODO，空载阶段应取消而非占位 |
