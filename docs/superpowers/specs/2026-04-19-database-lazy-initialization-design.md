# 数据库初始化方案设计文档

> **设计目标**: 解决 Next.js 构建时因缺少 DATABASE_URL 导致的失败问题。
>
> **最终方案**: 在 GitHub Actions 中添加 DATABASE_URL 环境变量，保持简单的直接初始化方式。

---

## 📋 方案演进

### 最终方案（已实施）✅

**方案**: CI/CD 环境变量注入 + 简单直接初始化

**核心思想**:

- 既然构建阶段必须有 DATABASE_URL（Next.js 静态分析需要），那就直接提供
- 不需要延迟初始化的复杂性
- 所有环境（CI/CD、Vercel、VPS）都配置 DATABASE_URL

**实施内容**:

1. GitHub Actions Build Job 添加 `DATABASE_URL` 环境变量
2. `db/index.ts` 保持简单直接初始化（25 行代码）
3. `auth.ts` 直接导入 `db` 对象

**优势**:

- ✅ 代码简单易懂（25 行 vs 65 行）
- ✅ 无额外复杂度（无 Proxy、无 globalThis、无工厂函数）
- ✅ 维护成本低
- ✅ 运行时行为一致

### 探索方案（已废弃）❌

**方案**: globalThis 单例模式延迟初始化

**为什么废弃**:

- 构建阶段仍然需要 DATABASE_URL（Next.js 静态分析 API 路由）
- 延迟初始化没有解决根本问题
- 增加了不必要的复杂度（65 行代码、Proxy、globalThis）
- 所有环境都有 DATABASE_URL，延迟初始化无意义

**详细信息**: 见下方历史分析

---

## 问题描述

### 原始问题

在 GitHub Actions 的 Build Job 中，Next.js 构建过程在 `Collecting page data` 阶段失败：

```
Error: Missing DATABASE_URL environment variable
at __TURBOPACK__module__evaluation__
```

### 根因分析

**错误链条**：

```
Next.js Build (Collecting page data)
  ↓
预渲染 API 路由: /api/[[...route]]
  ↓
导入 auth.ts (Better Auth 配置)
  ↓
导入 db/index.ts
  ↓
执行顶层代码: const client = postgres(DATABASE_URL)
  ↓
❌ 环境变量未设置 → 抛出错误
```

**当前代码问题**：

```typescript
// apps/app/src/api/db/index.ts
const connectionString = process.env.DATABASE_URL!;  // ← 顶层立即执行

if (!connectionString) {
  throw new Error("Missing DATABASE_URL environment variable");
}

const client = postgres(connectionString, { ... });  // ← 顶层立即执行
export const db = drizzle(client);  // ← 顶层立即执行
```

### 影响范围

- ❌ GitHub Actions Build Job 失败
- ❌ 无法生成构建产物
- ❌ 阻塞后续部署流程

---

## 设计方案

### 方案选择

**采用方案 A: globalThis 单例模式（懒加载）**

**选择理由**：

1. ✅ 项目已有成功先例（Redis 使用相同模式）
2. ✅ 与项目其他模块保持一致风格
3. ✅ 解决 Next.js 开发模式热重载问题
4. ✅ 构建时不执行任何副作用代码
5. ✅ 运行时首次使用时才创建连接

### 核心架构

#### 架构对比

**当前架构（立即初始化）**：

```
模块加载 → db/index.ts 执行 → 创建连接 → export db
                                    ↓
                              ❌ 构建时失败
```

**新架构（延迟初始化）**：

```
模块加载 → db/index.ts 执行（仅定义函数） → export getDb() + Proxy
                                                  ↓
                                          首次调用时创建连接
                                                  ↓
                                            ✅ 构建时安全
```

### 详细设计

#### 组件 1: db/index.ts（改造）

**文件**: `apps/app/src/api/db/index.ts`

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// 扩展 globalThis 类型
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
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
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
```

**设计要点**：

- ✅ 顶层代码无副作用（仅定义函数和 Proxy）
- ✅ Proxy 透明转发（保持原有 API）
- ✅ globalThis 单例（开发模式友好）
- ✅ 类型安全（TypeScript 完整支持）

---

#### 组件 2: auth.ts（改造）

**文件**: `apps/app/src/api/auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";

import { getDb } from "@/api/db"; // ← 改为导入 getDb 函数
import { authSchema } from "@/api/db/schema/auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    // ← 改为调用 getDb()
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

**改动说明**：

- ⚠️ 将 `import { db }` 改为 `import { getDb }`
- ⚠️ 将 `drizzleAdapter(db, ...)` 改为 `drizzleAdapter(getDb(), ...)`
- ✅ Better Auth 在运行时才调用，触发延迟初始化

---

### 数据流设计

#### 场景 A：构建阶段

```
Next.js Build
  ↓
Collecting page data
  ↓
import auth.ts
  ↓
import db/index.ts  ← 仅定义函数，不执行
  ↓
✅ 构建成功（无 DATABASE_URL 也不报错）
```

#### 场景 B：运行时首次请求

```
用户访问 /api/auth/get-session
  ↓
Better Auth 调用 getDb()
  ↓
检查 globalThis.__db → undefined
  ↓
创建 postgres 连接 + drizzle 实例
  ↓
缓存到 globalThis.__db
  ↓
✅ 返回数据库操作结果
```

#### 场景 C：后续请求

```
用户访问 /api/guestbook
  ↓
调用 db.select()
  ↓
Proxy 拦截 → 调用 getDb()
  ↓
检查 globalThis.__db → 已存在
  ↓
✅ 直接返回缓存实例（跳过初始化）
```

#### 场景 D：开发模式热重载

```
修改代码 → Next.js 热重载
  ↓
模块重新加载
  ↓
globalThis.__db 仍然存在
  ↓
✅ 复用已有连接（不会重复创建）
```

---

### 错误处理设计

#### 错误场景 1：运行时缺少 DATABASE_URL

**触发时机**：首次调用 `getDb()` 时

**处理方式**：

```typescript
if (!connectionString) {
  throw new Error("Missing DATABASE_URL environment variable");
}
```

**表现**：运行时抛出明确错误，开发者容易定位

---

#### 错误场景 2：数据库连接失败

**触发时机**：`postgres()` 创建连接时

**处理方式**：

```typescript
globalThis.__dbClient = postgres(connectionString, {
  connect_timeout: 10, // 10 秒超时
});
```

**表现**：抛出数据库连接错误，应用不启动

---

#### 错误场景 3：并发请求竞争

**分析**：Node.js 单线程模型天然避免并发问题

**处理方式**：

```typescript
if (!globalThis.__db) {
  // 只有一次能进入此分支
  globalThis.__db = drizzle(...);
}
return globalThis.__db;
```

**表现**：无需额外同步机制

---

### 测试策略

#### 单元测试

```typescript
describe("getDb", () => {
  beforeEach(() => {
    // 清理 globalThis 缓存
    globalThis.__db = undefined;
    globalThis.__dbClient = undefined;
  });

  it("应该在首次调用时创建连接", () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    const db1 = getDb();
    expect(db1).toBeDefined();
  });

  it("应该在后续调用时返回缓存实例", () => {
    const db1 = getDb();
    const db2 = getDb();
    expect(db1).toBe(db2); // 同一个实例
  });

  it("应该在缺少 DATABASE_URL 时抛出错误", () => {
    delete process.env.DATABASE_URL;
    expect(() => getDb()).toThrow("Missing DATABASE_URL");
  });
});
```

#### 构建测试

```bash
# 在没有 DATABASE_URL 的环境中构建
unset DATABASE_URL
bun run app:build
# ✅ 应该成功
```

---

## 影响分析

### 改动范围

| 文件                           | 改动类型 | 改动量     |
| ------------------------------ | -------- | ---------- |
| `apps/app/src/api/db/index.ts` | 重构     | 中等       |
| `apps/app/src/api/auth.ts`     | 修改     | 小（2 行） |

### API 兼容性

| 使用方               | 是否需要改动 | 说明               |
| -------------------- | ------------ | ------------------ |
| `auth.ts`            | ✅ 需要      | 改为调用 `getDb()` |
| 其他使用 `db` 的代码 | ❌ 不需要    | Proxy 透明转发     |

### 性能影响

| 场景       | 影响          | 说明                |
| ---------- | ------------- | ------------------- |
| 首次请求   | +1 次函数调用 | 可忽略不计          |
| 后续请求   | 0             | 直接返回缓存        |
| Proxy 开销 | 极小          | JavaScript 引擎优化 |

---

## 与现有模式的一致性

### Redis 单例模式（已有）

```typescript
// common/libs/redis.ts
declare global {
  var __redisInstance: Redis | undefined;
}

export function getRedis() {
  if (!globalThis.__redisInstance) {
    globalThis.__redisInstance = new Redis(...);
  }
  return globalThis.__redisInstance;
}
```

### 数据库单例模式（新）

```typescript
// api/db/index.ts
declare global {
  var __db: ReturnType<typeof drizzle> | undefined;
  var __dbClient: ReturnType<typeof postgres> | undefined;
}

export function getDb() {
  if (!globalThis.__db) {
    globalThis.__db = drizzle(postgres(...));
  }
  return globalThis.__db;
}
```

**一致性**：✅ 完全相同的模式

---

## 回滚方案

如果实施后出现问题，可以通过以下方式回滚：

### 方案 1: Git Revert

```bash
git revert <commit-hash>
```

### 方案 2: 恢复原始代码

将 `db/index.ts` 恢复为立即初始化模式：

```typescript
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { ... });
export const db = drizzle(client);
```

---

## 关键设计决策

### 为什么使用 Proxy？

**问题**：如何保持原有 API 不变？

**方案对比**：

| 方案     | API 变化         | 改动范围           |
| -------- | ---------------- | ------------------ |
| Proxy    | 无               | 仅 db/index.ts     |
| 工厂函数 | `db` → `getDb()` | 所有使用 db 的地方 |
| 导出对象 | 无               | 复杂               |

**决策**：使用 Proxy，因为：

1. ✅ 保持 API 不变
2. ✅ 改动范围最小
3. ✅ 性能开销可忽略

### 为什么使用 globalThis？

**问题**：如何确保开发模式热重载不重复创建连接？

**方案对比**：

| 方案       | 热重载      | 复杂度 |
| ---------- | ----------- | ------ |
| 模块级变量 | ❌ 重复创建 | 低     |
| globalThis | ✅ 复用连接 | 低     |
| 外部存储   | ✅ 复用连接 | 高     |

**决策**：使用 globalThis，因为：

1. ✅ 解决热重载问题
2. ✅ 与 Redis 模式一致
3. ✅ 实现简单

### 为什么 auth.ts 需要改动？

**问题**：Better Auth 适配器需要同步传入 db 对象

**限制**：Better Auth 在初始化时调用 `drizzleAdapter(db, ...)`，无法使用 Proxy

**决策**：在 auth.ts 中直接调用 `getDb()`，因为：

1. ✅ Better Auth 在运行时才初始化
2. ✅ 仅 1 个文件需要改动
3. ✅ 改动量极小（2 行）

---

## 总结

### 核心优势

1. ✅ **构建安全**：顶层无副作用代码
2. ✅ **运行时友好**：首次使用时初始化
3. ✅ **开发模式友好**：globalThis 单例复用
4. ✅ **API 兼容**：Proxy 透明转发
5. ✅ **一致性**：与 Redis 模式完全一致

### 实施风险

| 风险               | 概率 | 影响 | 缓解措施            |
| ------------------ | ---- | ---- | ------------------- |
| Proxy 性能         | 低   | 低   | JavaScript 引擎优化 |
| 类型安全问题       | 低   | 中   | TypeScript 类型声明 |
| Better Auth 兼容性 | 低   | 高   | 本地测试验证        |

---

## 📝 实施总结（2026-04-19）

### 最终决策

**选择简单方案**：在 GitHub Actions 中添加 `DATABASE_URL` 环境变量，保持直接初始化。

### 决策依据

1. **构建阶段约束**：
   - Next.js 在 `Collecting page data` 阶段会预渲染 API 路由
   - `auth.ts` 模块加载时立即调用 `betterAuth()`，进而调用 `getDb()`
   - **无论如何，构建阶段都需要 DATABASE_URL**

2. **环境一致性**：
   - CI/CD：需要 DATABASE_URL（构建）
   - Vercel：需要 DATABASE_URL（运行时）
   - VPS：需要 DATABASE_URL（运行时）
   - 本地开发：需要 DATABASE_URL（开发）

3. **简化优先原则**：
   - 延迟初始化没有解决根本问题（构建时仍需要 DATABASE_URL）
   - 增加了不必要的复杂度（65 行代码 vs 25 行）
   - 维护成本高（Proxy、globalThis、工厂函数）

### 方案对比

| 维度              | 延迟初始化（废弃）       | 简单初始化（采用） |
| ----------------- | ------------------------ | ------------------ |
| **代码行数**      | 65 行                    | 25 行              |
| **复杂度**        | 高（Proxy + globalThis） | 低（直接初始化）   |
| **构建时需要 DB** | ✅ 是                    | ✅ 是              |
| **运行时需要 DB** | ✅ 是                    | ✅ 是              |
| **维护成本**      | 高                       | 低                 |
| **理解难度**      | 需要理解多个概念         | 一目了然           |

### 实施内容

1. ✅ **GitHub Actions 工作流更新**（`.github/workflows/ci-cd.yml`）

   ```yaml
   - name: 🏗️ Build Next.js app
     env:
       DATABASE_URL: ${{ secrets.DATABASE_URL }} # 新增
   ```

2. ✅ **数据库模块保持简单**（`apps/app/src/api/db/index.ts`）
   - 25 行代码
   - 直接初始化
   - 无延迟加载

3. ✅ **认证模块简化**（`apps/app/src/api/auth.ts`）
   - 直接导入 `db` 对象
   - 不使用 `getDb()` 函数

### 经验教训

1. **先理解约束，再设计方案**
   - 我们最初以为延迟初始化可以让构建时不需要 DATABASE_URL
   - 但实际上 Next.js 的静态分析机制要求构建时必须有 DATABASE_URL
   - **教训**：在设计方案前，先彻底理解所有约束条件

2. **简单就是美**
   - 当复杂性没有带来额外价值时，选择简单方案
   - 65 行复杂代码 vs 25 行简单代码，功能完全相同
   - **教训**：定期审视技术方案，去除不必要的复杂度

3. **迭代式改进**
   - 先实施了延迟初始化方案
   - 发现构建时仍需要 DATABASE_URL 后，回退到简单方案
   - **教训**：允许试错，及时纠正方向

### Git 提交记录

```
e3d0259 refactor(database): revert to simple initialization scheme
ce51e00 ci(build): add DATABASE_URL to GitHub Actions build job
6e6bbec refactor(auth): use getDb() for lazy database initialization
1b0db64 refactor(database): implement lazy initialization with globalThis singleton pattern
```

### 相关文档

- 实施计划：`docs/superpowers/plans/2026-04-19-database-lazy-initialization-plan.md`
- PR #32：https://github.com/qinshi0930/xingyed.site/pull/32
