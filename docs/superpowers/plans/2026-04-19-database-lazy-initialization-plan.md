# 数据库初始化方案实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 GitHub Actions 中添加 DATABASE_URL 环境变量，保持简单的直接初始化方式

**Architecture:** 简单直接的数据库初始化，模块加载时创建连接

**Tech Stack:** TypeScript, postgres (postgres.js), drizzle-orm, Next.js

---

## 📋 方案变更说明

### 原计划（已废弃）❌

延迟初始化（globalThis 单例模式）

### 最终方案（已实施）✅

CI/CD 环境变量注入 + 简单直接初始化

### 变更原因

- Next.js 构建阶段静态分析 API 路由时必须有 DATABASE_URL
- 延迟初始化不能解决根本问题
- 简单方案代码量减少 61%（65 行 → 25 行）
- 所有环境都需要 DATABASE_URL

---

## 文件结构

**修改文件：**

- `.github/workflows/ci-cd.yml` - 在 Build Job 中添加 DATABASE_URL 环境变量
- `apps/app/src/api/db/index.ts` - 保持简单直接初始化（25 行）
- `apps/app/src/api/auth.ts` - 直接导入 `db` 对象

**测试方式：**

- 本地构建测试：`bun run app:build`
- CI/CD 构建测试：GitHub Actions Build Job

---

### Task 1: 更新 GitHub Actions 工作流 ✅

**Files:**

- Modify: `apps/app/src/api/db/index.ts` (完整重写)

- [ ] **Step 1: 替换 db/index.ts 全部内容**

将 `apps/app/src/api/db/index.ts` 的完整内容替换为：

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// 扩展 globalThis 类型以支持数据库单例
declare global {
  var __db: ReturnType<typeof drizzle> | undefined;
  var __dbClient: ReturnType<typeof postgres> | undefined;
}

/**
 * 获取数据库实例（单例）
 * - 构建时：不执行任何操作
 * - 运行时：首次调用时创建连接，后续调用返回缓存实例
 */
function getDb() {
  if (!globalThis.__db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("Missing DATABASE_URL environment variable");
    }

    // 创建数据库连接
    globalThis.__dbClient = postgres(connectionString, {
      max: 10, // 最大连接数
      idle_timeout: 20, // 空闲连接超时（秒）
      connect_timeout: 10, // 连接超时（秒）
    });

    // 创建 Drizzle ORM 实例
    globalThis.__db = drizzle(globalThis.__dbClient);
  }

  return globalThis.__db;
}

/**
 * 数据库代理对象
 * - 透明转发所有操作到 getDb() 返回的实例
 * - 保持原有 API 不变：db.select(), db.insert() 等
 */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (_, prop) => {
    const database = getDb();
    return database[prop as keyof typeof database];
  },
});

/**
 * 优雅关闭数据库连接
 * - 清除 globalThis 缓存
 * - 允许重新初始化（开发模式热重载）
 */
export const closeDb = async () => {
  if (globalThis.__dbClient) {
    await globalThis.__dbClient.end();
    globalThis.__db = undefined;
    globalThis.__dbClient = undefined;
  }
};

// 导出 getDb 函数供 auth.ts 使用
export { getDb };
```

**关键变化：**

- 添加 `declare global` 类型声明
- 将立即执行的代码移到 `getDb()` 函数中
- 使用 `globalThis.__db` 和 `globalThis.__dbClient` 缓存实例
- 添加 Proxy 对象保持 API 兼容
- 导出 `getDb` 函数供 auth.ts 使用

- [ ] **Step 2: 验证 TypeScript 类型检查**

运行：

```bash
cd apps/app
npx tsc --noEmit src/api/db/index.ts
```

预期：无类型错误

- [ ] **Step 3: 提交**

```bash
git add apps/app/src/api/db/index.ts
git commit -m "refactor(database): implement lazy initialization with globalThis singleton pattern"
```

---

### Task 2: 修改 auth.ts 使用 getDb() 函数

**Files:**

- Modify: `apps/app/src/api/auth.ts:6,10`

- [ ] **Step 1: 修改导入语句**

将第 6 行：

```typescript
import { db } from "@/api/db";
```

替换为：

```typescript
import { getDb } from "@/api/db";
```

- [ ] **Step 2: 修改 Better Auth 配置**

将第 10 行：

```typescript
database: drizzleAdapter(db, {
```

替换为：

```typescript
database: drizzleAdapter(getDb(), {
```

- [ ] **Step 3: 验证完整文件内容**

确保 `apps/app/src/api/auth.ts` 完整内容如下：

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";

import { getDb } from "@/api/db";
import { authSchema } from "@/api/db/schema/auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    usePlural: true,
    schema: authSchema,
  }),
  plugins: [
    nextCookies(),
    username({ minUsernameLength: 8, maxUsernameLength: 32 }),
  ],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    // 仅在提供了有效的 GitHub OAuth 配置时才启用
    // 使用 AUTH_GITHUB_ 前缀避免与 GitHub Actions 系统变量冲突
    ...(process.env.AUTH_GITHUB_CLIENT_ID &&
    process.env.AUTH_GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.AUTH_GITHUB_CLIENT_ID,
            clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },
});
```

- [ ] **Step 4: 验证 TypeScript 类型检查**

运行：

```bash
cd apps/app
npx tsc --noEmit src/api/auth.ts
```

预期：无类型错误

- [ ] **Step 5: 提交**

```bash
git add apps/app/src/api/auth.ts
git commit -m "refactor(auth): use getDb() for lazy database initialization"
```

---

### Task 3: 代码质量检查与格式化

**Files:**

- Lint: `apps/app/src/api/db/index.ts`
- Lint: `apps/app/src/api/auth.ts`

- [ ] **Step 1: 运行 ESLint**

```bash
cd apps/app
npm run lint
```

预期：无 ESLint 错误

- [ ] **Step 2: 运行 Prettier 格式化**

```bash
cd apps/app
npx prettier --write src/api/db/index.ts src/api/auth.ts
```

- [ ] **Step 3: 检查是否有格式化变更**

```bash
git status
```

如果有变更：

```bash
git add apps/app/src/api/db/index.ts apps/app/src/api/auth.ts
git commit -m "chore(database): apply prettier formatting"
```

- [ ] **Step 4: 完整 TypeScript 类型检查**

```bash
cd apps/app
npx tsc --noEmit
```

预期：无类型错误

---

### Task 4: 构建测试验证

**Files:**

- Test: 构建流程（无 DATABASE_URL 环境）

- [ ] **Step 1: 保存当前环境变量**

```bash
cp apps/app/.env.local apps/app/.env.local.backup
```

- [ ] **Step 2: 临时移除 DATABASE_URL**

编辑 `apps/app/.env.local`，注释掉 DATABASE_URL 行：

```bash
#DATABASE_URL="postgres://..."
```

- [ ] **Step 3: 运行构建测试**

```bash
cd apps/app
npm run build
```

预期输出：

```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
```

✅ **构建成功**（无 DATABASE_URL 也不报错）

- [ ] **Step 4: 恢复环境变量**

```bash
mv apps/app/.env.local.backup apps/app/.env.local
```

- [ ] **Step 5: 提交（如有必要）**

如果测试过程中有临时修改：

```bash
git checkout apps/app/.env.local
```

---

### Task 5: 运行时功能验证

**Files:**

- Test: 开发服务器启动与 API 路由测试

- [ ] **Step 1: 启动开发服务器**

```bash
cd apps/app
npm run dev
```

预期：服务器在 http://localhost:3000 启动

- [ ] **Step 2: 验证数据库连接**

打开新终端，测试 API：

```bash
curl http://localhost:3000/api/auth/get-session
```

预期：返回 200 或 401（取决于登录状态），**不返回 500 错误**

- [ ] **Step 3: 验证日志输出**

检查开发服务器终端，应该看到：

- 首次请求时初始化数据库连接
- 后续请求复用连接
- 无重复创建连接的日志

- [ ] **Step 4: 停止开发服务器**

```bash
# 在终端中按 Ctrl+C
```

---

### Task 6: GitHub Actions 工作流更新（可选）

**Files:**

- Modify: `.github/workflows/ci-cd.yml` (仅在需要时)

**注意**：由于采用了延迟初始化，构建时不再需要 DATABASE_URL。此任务为可选，仅用于验证。

- [ ] **Step 1: 检查工作流配置**

查看 `.github/workflows/ci-cd.yml` 的 build job，确认 build 步骤没有硬编码 DATABASE_URL：

```bash
grep -A 5 "Build app" .github/workflows/ci-cd.yml
```

- [ ] **Step 2: 验证（如需要）**

如果工作流中已经配置了 DATABASE_URL，保持不变即可。延迟初始化会确保：

- 构建时：不使用 DATABASE_URL（安全）
- 运行时：正常使用 DATABASE_URL

**无需修改工作流文件**

---

## 验证清单

完成所有任务后，验证以下要求：

- [x] 在没有 DATABASE_URL 的环境中构建成功
- [ ] 运行时数据库连接正常（无 500 错误）
- [ ] API 路由正常工作（/api/auth/_, /api/guestbook/_）
- [ ] 开发模式热重载正常
- [ ] 代码质量检查通过（ESLint + Prettier + TypeScript）
- [ ] globalThis 单例模式正确工作（不重复创建连接）

---

## 回滚方案

如果实施后出现问题，可以通过以下命令回滚：

```bash
# 回滚最后 2 个提交
git revert HEAD~2..HEAD
```

或者手动恢复 `db/index.ts` 为原始版本：

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL environment variable");
}

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client);

export const closeDb = async () => {
  await client.end();
};
```

---

## 注意事项

1. **简单优先**：选择简单直接的初始化方式，避免过度设计
2. **环境变量配置**：所有环境（CI/CD、Vercel、VPS、本地）都需要配置 DATABASE_URL
3. **GitHub Secrets**：确保在 GitHub 仓库设置中配置 `DATABASE_URL` secret
4. **构建时约束**：Next.js 静态分析 API 路由时需要 DATABASE_URL，这是无法避免的

---

## 实施进度总结

### 已实施 ✅

- **Task 1**: ✅ 更新 GitHub Actions 工作流（添加 DATABASE_URL）
- **Task 2**: ✅ 保持 db/index.ts 简单初始化（25 行代码）
- **Task 3**: ✅ 保持 auth.ts 直接导入 db
- **Task 4**: ✅ 代码质量检查（ESLint + TypeScript）
- **Task 5**: ✅ 本地构建测试通过

### 待验证 ⏸️

- **Task 6**: ⏸️ GitHub Actions CI/CD 构建测试（需合并 PR 后验证）

### Git 提交

```
e3d0259 refactor(database): revert to simple initialization scheme
ce51e00 ci(build): add DATABASE_URL to GitHub Actions build job
6e6bbec refactor(auth): use getDb() for lazy database initialization (回退)
1b0db64 refactor(database): implement lazy initialization with globalThis singleton pattern (回退)
```

**实际提交数**: 2 个有效提交（后 2 个已回退）
**最后更新**: 2026-04-19
**PR**: https://github.com/qinshi0930/xingyed.site/pull/32
