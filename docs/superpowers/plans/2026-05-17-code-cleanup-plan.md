# 代码层精简实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变运行时行为的前提下，移除 monorepo TypeScript 源码中的死代码块、注释残留与历史豁免，整体提升代码可读性与 AI 协作上下文质量。

**Architecture:** 单分支 `chore/code-cleanup`，按"目录 → 主题"切分多 commit 顺序提交：先 `app` 路由层、再 `modules`、再 `common`、再 `eslint-disable` 豁免审视、最后冒烟测试与 PR。每个 commit 之间跑 `bun run build && bun run lint && bunx tsc --noEmit` 守门。

**Tech Stack:** TypeScript / Next.js (App Router) / Bun / ESLint / Husky / Git。

**Spec 来源：** [2026-05-17-code-cleanup-design.md](../specs/2026-05-17-code-cleanup-design.md)

---

## 精确靶点清单（基于扫描）

### a/i 类（注释代码块）—— 4 个目录、9 处文件

| #   | 文件                                                    | 行号             | 内容                                                   |
| --- | ------------------------------------------------------- | ---------------- | ------------------------------------------------------ |
| 1   | `apps/app/src/app/(page)/dashboard/page.tsx`            | 17, 20–26, 31    | `getGithubUser` 行注释 + `SWRConfig` 包裹注释          |
| 2   | `apps/app/src/modules/about/components/About.tsx`       | 9–43, 65–67      | 大段 `TABS` 注释 + `TabLabel` 函数注释                 |
| 3   | `apps/app/src/modules/about/components/CareerCard.tsx`  | 29–30, 32–34, 36 | dayjs 日期计算的 5 行注释                              |
| 4   | `apps/app/src/modules/blog/components/BlogDetail.tsx`   | 37–40            | `formatTagName` 函数注释                               |
| 5   | `apps/app/src/modules/projects/components/Projects.tsx` | 15–16, 22        | `interface` 内 `loadMore/hasMore` + `filteredProjects` |
| 6   | `apps/app/src/common/stores/store-provider.tsx`         | 8, 19, 25        | `NextAuthProvider` import 与 JSX 注释                  |
| 7   | `apps/app/src/common/mdx/utils/file.ts`                 | 53–67            | `getPostInformation` 函数体注释                        |
| 8   | `apps/app/src/common/constant/menu.tsx`                 | 92–100, 127–156  | 菜单项注释                                             |
| 9   | `apps/app/src/common/constant/github.ts`                | 2–8              | `work` 账号配置注释                                    |
| 10  | `apps/app/src/common/constant/education.ts`             | 4–23             | 两段历史教育经历注释                                   |

> ⚠️ **注意 9/10 是数据层**：`github.ts`、`education.ts` 的注释是"前任作者的旧数据"，删除前需用户在同步点 ① 确认。git 历史可恢复。

### b 类（eslint-disable 豁免审视）—— 7 处文件

| #   | 文件                                                          | 行号 | 豁免规则                                                       |
| --- | ------------------------------------------------------------- | ---- | -------------------------------------------------------------- |
| 1   | `apps/app/src/common/libs/utils/logger.ts`                    | 1    | `// eslint-disable-next-line unused-imports/no-unused-vars`    |
| 2   | `apps/app/src/common/components/elements/CodeBlock.tsx`       | 35   | `// eslint-disable-next-line unused-imports/no-unused-vars`    |
| 3   | `apps/app/src/common/components/layouts/index.tsx`            | 1    | `/* eslint-disable unused-imports/no-unused-vars */`（文件级） |
| 4   | `apps/app/src/api/routes/read-stats.ts`                       | 21   | `// eslint-disable-next-line unused-imports/no-unused-vars`    |
| 5   | `apps/app/src/modules/learn/components/ContentPlayground.tsx` | 3    | `// eslint-disable-next-line unused-imports/no-unused-vars`    |
| 6   | `apps/app/src/common/mdx/evaluate.tsx`                        | 1    | `/* eslint-disable unused-imports/no-unused-vars */`（文件级） |
| 7   | `apps/app/src/common/components/sidebar/Navigation.tsx`       | 1    | `/* eslint-disable unused-imports/no-unused-vars */`（文件级） |

### e 类、f 类、scripts、packages

- `apps/app/src` 范围内 0 处 `console.log`/`debugger`/`TODO`/`FIXME`（已扫描确认）
- `apps/app/scripts/**` 与 `packages/**` 无注释代码块（已扫描确认）
- → 这三类不产生 Task

---

## File Structure

本计划**不创建任何新文件**，所有改动均为现有文件的删除/缩小。涉及文件如清单所示。

---

## Task 0：准备工作

**Files:** 无文件改动，仅 git 操作。

- [ ] **Step 0.1：确认当前在 main 且工作区干净**

```bash
cd /home/xingye/workspace/xingyed.site
git status
git branch --show-current
```

期望输出：`main` 分支、`nothing to commit, working tree clean`。

- [ ] **Step 0.2：拉取最新 main 并切分支**

```bash
git pull origin main --ff-only
git checkout -b chore/code-cleanup
```

期望：分支切换成功，HEAD 与 origin/main 对齐。

- [ ] **Step 0.3：跑一次基线验证（确保起点干净）**

```bash
cd apps/app && bun run lint && bunx tsc --noEmit && cd -
```

期望：全部通过。若失败说明 main 本身已坏，停止并报告。

---

## Task 1：清理 app 路由层注释代码块

**Files:**

- Modify: `apps/app/src/app/(page)/dashboard/page.tsx`（删除行 17、20–26、31）

- [ ] **Step 1.1：删除 dashboard/page.tsx 中的注释代码**

把当前文件内容（36 行）中的 `getGithubUser` 注释行与 `SWRConfig` 包裹注释整体删除，函数体只保留 JSX 返回值。

修改后该文件应为如下结构（共约 19 行）：

```tsx
import type { Metadata } from "next";

import Container from "@/common/components/elements/Container";
import PageHeading from "@/common/components/elements/PageHeading";
import Dashboard from "@/modules/dashboard";

const PAGE_TITLE = "Dashboard";
const PAGE_DESCRIPTION =
  "This is my personal dashboard, built with Next.js API routes deployed as serverless functions.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} - Adam`,
  description: PAGE_DESCRIPTION,
};

const DashboardPage = async () => {
  return (
    <Container data-aos="fade-up">
      <PageHeading title={PAGE_TITLE} description={PAGE_DESCRIPTION} />
      <Dashboard />
    </Container>
  );
};

export default DashboardPage;
```

> ⚠️ 不修改 `PAGE_TITLE`、`PAGE_DESCRIPTION`、`Adam` 等文案——这属于文案层，不在本次范围。

- [ ] **Step 1.2：本地验证**

```bash
cd apps/app && bun run lint && bunx tsc --noEmit && cd -
```

期望：通过。

- [ ] **Step 1.3：commit**

```bash
git add apps/app/src/app/\(page\)/dashboard/page.tsx
git commit -m "chore: 清理 dashboard 路由层注释代码块

移除 dashboard/page.tsx 中被注释掉的 SWRConfig 包裹与
getGithubUser 调用，零行为变化。"
```

---

## Task 2：清理 modules 注释代码块

**Files:**

- Modify: `apps/app/src/modules/about/components/About.tsx`（删除行 9–43、65–67）
- Modify: `apps/app/src/modules/about/components/CareerCard.tsx`（删除行 29–30、32–34、36）
- Modify: `apps/app/src/modules/blog/components/BlogDetail.tsx`（删除行 37–40）
- Modify: `apps/app/src/modules/projects/components/Projects.tsx`（删除行 15–16、22）

- [ ] **Step 2.1：清理 About.tsx**

删除 `const About = () => {` 内部所有 `// const TABS = ...` 系列注释（行 9–43）以及文件末尾 `// const TabLabel = ...` 注释（行 65–67）。最终该函数体直接进入 `return (`。

修改后函数应为：

```tsx
const About = () => {
  return (
    <section className="space-y-6">
      <Story />
      <Breakline />
      <div className="space-y-5">
        <div>
          <div className="flex gap-2 items-center">
            <EducationIcon size={24} strokeWidth={1} /> Education
          </div>
          <p className="pt-2 text-neutral-600 dark:text-neutral-400">
            My educational journey.
          </p>
        </div>
        <EducationList />
      </div>
    </section>
  );
};

export default About;
```

- [ ] **Step 2.2：清理 CareerCard.tsx**

删除 `const [isShowResponsibility, ...]` 之后、`const startDateFormatted = formatDate(...)` 之前的所有 dayjs 注释（共 5 行带空行）。修改后这段应为：

```tsx
const [isShowResponsibility, setIsShowResponsibility] =
  useState<boolean>(false);

const startDateFormatted = formatDate(start_date, "MMM YYYY");
const endDateFormatted = end_date
  ? formatDate(end_date, "MMM YYYY")
  : "Present";
const durationText = calculateDuration(start_date, end_date);
```

- [ ] **Step 2.3：清理 BlogDetail.tsx**

删除 `handleTocChanged` 之后、`return (` 之前的 `// const formatTagName = ...` 4 行注释。修改后：

```tsx
	const handleTocChanged = useCallback((newToc: TocItem[]) => {
		if (!isEqual(tocData, newToc)) {
			setTocData(newToc);
		}
	}, []);

	return (
```

- [ ] **Step 2.4：清理 Projects.tsx**

把 `interface ProjectsComponentProps` 内的两行注释 `// loadMore: () => void;` 和 `// hasMore: boolean;` 删除；同时删除 `const Projects = ...` 函数体内的 `// const filteredProjects = ...` 行。修改后接口与函数头部应为：

```tsx
interface ProjectsComponentProps {
	projects: ProjectsProps["projects"];
}

const Projects = ({ projects }: ProjectsComponentProps) => {
	const [visibleProjects, setVisibleProjects] = useState(6);

	if (projects?.length === 0) {
		return <EmptyState message="No Data" />;
	}
```

- [ ] **Step 2.5：本地验证**

```bash
cd apps/app && bun run lint && bunx tsc --noEmit && cd -
```

期望：通过。若 `Projects.tsx` 报 `loadMore`/`hasMore` 未定义之类，说明删错了——回退步骤 2.4 重做。

- [ ] **Step 2.6：commit**

```bash
git add apps/app/src/modules/about/components/About.tsx \
        apps/app/src/modules/about/components/CareerCard.tsx \
        apps/app/src/modules/blog/components/BlogDetail.tsx \
        apps/app/src/modules/projects/components/Projects.tsx
git commit -m "chore: 清理 modules 注释代码块

- About.tsx: 移除大段 TABS 与 TabLabel 注释
- CareerCard.tsx: 移除已被 formatDate/calculateDuration 取代的 dayjs 注释
- BlogDetail.tsx: 移除未使用的 formatTagName 注释
- Projects.tsx: 移除注释的 loadMore/hasMore 接口字段与 filteredProjects"
```

---

## Task 3：清理 common 注释代码块

**Files:**

- Modify: `apps/app/src/common/stores/store-provider.tsx`（删除行 8、19、25）
- Modify: `apps/app/src/common/mdx/utils/file.ts`（删除行 53–67）
- Modify: `apps/app/src/common/constant/menu.tsx`（删除行 92–100、127–156）
- Modify: `apps/app/src/common/constant/github.ts`（删除行 2–8）
- Modify: `apps/app/src/common/constant/education.ts`（删除行 4–23）

> 同步点 ①：本 task 触及 `github.ts`、`education.ts` 数据层注释（前作者旧数据），开始前请用户最终确认。如有任何"想留着"的项目，先在此 task 内主动豁免并记录到 PR 描述。

- [ ] **Step 3.1：清理 store-provider.tsx**

删除 `// import NextAuthProvider from "./nextauth-provider";`（行 8），以及 JSX 中包裹的 `// <NextAuthProvider>` / `// </NextAuthProvider>` 两行（行 19、25）。修改前先读全文确认 NextAuthProvider 确实未使用，再删除。

- [ ] **Step 3.2：清理 mdx/utils/file.ts**

删除文件末尾被注释的 `getPostInformation` 函数（行 53–67）。该函数已被注释，无任何调用方。

- [ ] **Step 3.3：清理 constant/menu.tsx**

删除两段菜单项注释块：行 92–100 的一段 + 行 127–156 的连续三段。清理后保留所有未注释的菜单项原样。

- [ ] **Step 3.4：清理 constant/github.ts**

删除数组首部 `// { ... }` work 账号 7 行注释（行 2–8）。清理后数组应只剩 `qinshi0930` personal 账号一项。

- [ ] **Step 3.5：清理 constant/education.ts**

删除数组首部两段历史教育经历注释（行 4–23），保留当前的 `HUNAN UNIVERSITY OF SCIENCE AND ENGINEERING` 一项。

- [ ] **Step 3.6：本地验证**

```bash
cd apps/app && bun run build && bun run lint && bunx tsc --noEmit && cd -
```

期望：通过。`build` 在本 task 也跑一次（因涉及数据 constant，更稳）。

- [ ] **Step 3.7：commit**

```bash
git add apps/app/src/common/stores/store-provider.tsx \
        apps/app/src/common/mdx/utils/file.ts \
        apps/app/src/common/constant/menu.tsx \
        apps/app/src/common/constant/github.ts \
        apps/app/src/common/constant/education.ts
git commit -m "chore: 清理 common 注释代码块

- store-provider.tsx: 移除 NextAuthProvider 引用注释
- mdx/utils/file.ts: 移除已注释的 getPostInformation
- constant/menu.tsx: 移除被注释的菜单项
- constant/github.ts: 移除前任作者的 work 账号注释
- constant/education.ts: 移除前任作者的历史教育经历注释"
```

---

## Task 4：审视并精简 eslint-disable 豁免

**Files:** 7 处文件（见上方靶点清单 b 类表）。

逐文件按相同子流程处理：① 把豁免注释删除 → ② 跑 lint → ③ 若无新错则保留删除；若有新错则把豁免范围尽量收窄并补充原因注释。

- [ ] **Step 4.1：处理 logger.ts**

```bash
# 1. 编辑 apps/app/src/common/libs/utils/logger.ts，删除第 1 行的 eslint-disable-next-line 注释
# 2. 验证
cd apps/app && bun run lint 2>&1 | grep -E "logger.ts|warning|error" | head -20 && cd -
```

期望：无新 lint error。若有，回退并保留豁免，但加上 `// 原因：xxx` 注释说明保留依据。

- [ ] **Step 4.2：处理 CodeBlock.tsx**

同 4.1 步骤，对 `apps/app/src/common/components/elements/CodeBlock.tsx:35`。

- [ ] **Step 4.3：处理 layouts/index.tsx**

文件级豁免 `/* eslint-disable unused-imports/no-unused-vars */`。

- 优先尝试删除整个豁免
- 若 lint 报错，把它降级为只针对具体行的 `// eslint-disable-next-line ...`
- 实在不行，文件级保留但加注释说明

- [ ] **Step 4.4：处理 read-stats.ts**

同 4.1 步骤，对 `apps/app/src/api/routes/read-stats.ts:21`。

- [ ] **Step 4.5：处理 ContentPlayground.tsx**

同 4.1 步骤，对 `apps/app/src/modules/learn/components/ContentPlayground.tsx:3`。

- [ ] **Step 4.6：处理 evaluate.tsx**

文件级豁免，按 4.3 同样的"删→降级→保留"三步策略。

- [ ] **Step 4.7：处理 Navigation.tsx**

文件级豁免，按 4.3 同样策略。

- [ ] **Step 4.8：整体验证**

```bash
cd apps/app && bun run build && bun run lint && bunx tsc --noEmit && cd -
```

期望：全部通过。

- [ ] **Step 4.9：commit**

```bash
git add -A
git commit -m "chore: 审视并精简 eslint-disable 豁免

逐文件检查 7 处 unused-imports 豁免：
- 能直接移除的全部移除
- 必须保留的把范围从文件级降级为行级，并补原因注释

文件清单：
- common/libs/utils/logger.ts
- common/components/elements/CodeBlock.tsx
- common/components/layouts/index.tsx
- api/routes/read-stats.ts
- modules/learn/components/ContentPlayground.tsx
- common/mdx/evaluate.tsx
- common/components/sidebar/Navigation.tsx"
```

---

## Task 5：冒烟测试 + 推送 + PR

**Files:** 无文件改动。

- [ ] **Step 5.1：本地启动 dev**

```bash
cd apps/app && bun run dev
```

服务启动后保持运行。

- [ ] **Step 5.2：浏览器逐页冒烟**

依次访问以下 URL，每页观察：① 控制台无报错 ② 渲染正常。

- http://localhost:3000/
- http://localhost:3000/about
- http://localhost:3000/blog
- http://localhost:3000/projects
- http://localhost:3000/dashboard （重点确认 GitHub 贡献图加载）
- http://localhost:3000/learn
- http://localhost:3000/contact
- http://localhost:3000/guestbook

任何页面 404/500/控制台红色报错 → 停止并定位是哪一 task 引入；必要时 `git revert` 该 commit 后重做。

- [ ] **Step 5.3：停 dev，跑最终生产构建**

```bash
# Ctrl+C 停止 dev
cd apps/app && bun run build && cd -
```

期望：构建完成，无 error。

- [ ] **Step 5.4：推送分支**

```bash
git push -u origin chore/code-cleanup
```

> 若 husky pre-push hook 拦截，按记忆「临时禁用husky pre-push hook完成推送」处理。

- [ ] **Step 5.5：创建 PR**

在 GitHub 网页或 `gh` CLI 创建 PR：

- 目标分支：`main`
- 标题：`chore: 代码层精简 - 清理注释代码块与 eslint-disable 豁免`
- 描述模板：

```markdown
## 背景

依据 spec [2026-05-17-code-cleanup-design.md](docs/superpowers/specs/2026-05-17-code-cleanup-design.md) 实施一次代码层精简。

## 改动概览

- a/i 类（注释代码块）：清理 10 处文件
- b 类（eslint-disable 豁免审视）：处理 7 处文件
- e/f 类：扫描全范围 0 处，无 commit

## 验收清单

- [x] bun run build 通过
- [x] bun run lint 无新 warning
- [x] bunx tsc --noEmit 通过
- [x] 7 个主要页面冒烟通过
- [x] 零行为变化、零 UI 变化、零 API 契约变化

## 文件清单

（贴上 spec 中的精确靶点表）

## 关联文档

- 设计：docs/superpowers/specs/2026-05-17-code-cleanup-design.md
- 计划：docs/superpowers/plans/2026-05-17-code-cleanup-plan.md
```

- [ ] **Step 5.6：同步点 ②（用户 review PR）**

等待用户 review。任何修改建议在本分支补 commit，不开新分支。审批通过后由用户合并。

---

## 最终验收（全部 Task 完成后）

- [ ] 所有 a/i 类靶点（10 处文件）清理完毕，git diff 仅删除注释行
- [ ] 7 处 eslint-disable 豁免每一处都有处置结果记录在 commit 信息或 PR 描述
- [ ] 5 个 commit 顺序清晰：dashboard → modules → common → eslint-disable → （冒烟无新 commit）
- [ ] PR 已创建并附完整描述
- [ ] 用户已 review 并合并

## 回滚策略

每个 commit 独立可回滚：

```bash
# 单 commit 回滚（保留分支）
git revert <commit-sha>

# 整 PR 回滚（合并后）
git revert -m 1 <merge-commit-sha>
```

由于零行为变化，回滚不会引发数据/状态问题。
