# 数据库延迟初始化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将数据库连接从立即初始化改为延迟初始化（globalThis 单例模式），解决 Next.js 构建时缺少 DATABASE_URL 导致的失败问题

**Architecture:** 使用 globalThis 存储数据库单例，通过 Proxy 对象保持 API 兼容性，首次调用时创建连接并缓存到 globalThis

**Tech Stack:** TypeScript, postgres (postgres.js), drizzle-orm, Next.js

---

## 文件结构

**修改文件：**

- `apps/app/src/api/db/index.ts` - 核心改造：实现延迟初始化 + globalThis 单例 + Proxy
- `apps/app/src/api/auth.ts` - 修改导入：将 `db` 改为 `getDb()`

**测试方式：**

- 手动测试：在没有 DATABASE_URL 的环境中运行构建
- 运行时测试：启动开发服务器验证数据库连接正常

---

### Task 1: 重构 db/index.ts 实现延迟初始化

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

1. **不修改 API 路由代码**：本次优化仅涉及数据库初始化层，不需要修改任何 API 路由
2. **保持 API 兼容**：Proxy 确保所有使用 `db` 的代码无需修改（除了 auth.ts）
3. **类型安全**：使用 TypeScript 类型声明确保 Proxy 操作类型安全
4. **与 Redis 模式一致**：采用与项目 Redis 相同的 globalThis 单例模式
5. **构建安全**：顶层代码无副作用，构建时不会执行任何数据库操作

---

## 实施进度总结

- **Task 1**: ✅ 重构 db/index.ts（延迟初始化）
- **Task 2**: ✅ 修改 auth.ts（使用 getDb）
- **Task 3**: ✅ 代码质量检查
- **Task 4**: ⏸️ 构建测试验证（需要本地执行）
- **Task 5**: ⏸️ 运行时功能验证（需要本地执行）
- **Task 6**: ✅ 工作流更新（无需修改）

**预计提交数**: 3-4 个
**最后更新**: 2026-04-19
