## Context

当前项目有11个API路由分散在两个位置：
- `apps/app/src/app/api/*/route.ts` - 11个Next.js Route Handler（实际工作）
- `apps/app/src/modules/*/api.ts` - 2个Hono路由（死代码，上次Monorepo迁移遗留）

由于Next.js路由优先级（具体路径 > 动态路由），`[[...route]]/route.ts` 中挂载的Hono路由从未执行，实际的blog和contact请求由独立的 `route.ts` 文件处理。

**约束**：
- 已有Hono 4.10.4依赖
- 使用TypeScript路径别名 `@/*` 映射到 `./src/*`
- 前端使用SWR和axios调用API
- 需要保持现有API响应格式兼容

## Goals / Non-Goals

**Goals:**
- 统一所有API路由到 `src/api/` 目录
- 全部采用Hono框架实现，移除Next.js原生Route Handler混用
- 创建中间件系统（全局错误处理、缓存策略）
- 清理死代码，修复Contact API请求体bug
- 分4批次渐进式迁移，每批可独立验证

**Non-Goals:**
- 不添加自动化测试（本次重构采用手动验证）
- 不修改业务逻辑层（services和common/libs保持不变）
- 不改变API响应数据结构（保持前端兼容）
- 不添加新的API端点

## Decisions

### 1. 目录结构：`src/api/` 集中管理

**决策**：所有API路由放在 `src/api/` 目录，按功能模块分文件。

**理由**：
- API路由集中管理，易于查找和维护
- 与modules（UI+业务逻辑）、services（第三方API客户端）职责清晰分离
- 符合单一职责原则

**替代方案考虑**：
- ~~保留在modules目录~~：不是所有模块都有UI（如github, spotify）
- ~~混合方案~~：两套存放规则增加认知负担

### 2. 错误处理：全局中间件 + 路由级扩展

**决策**：在 `src/api/index.ts` 配置 `app.onError()` 作为兜底，允许特殊路由保留try-catch。

**理由**：
- 减少重复代码
- 统一错误响应格式 `{ status: false, error: string }`
- 保留特殊路由的额外处理能力

### 3. 缓存策略：通用缓存中间件

**决策**：创建 `src/api/middleware/cache.ts`，按需使用。

**理由**：
- 默认策略：60秒s-maxage + 30秒stale-while-revalidate
- GET路由按需应用，POST路由不使用
- 可自定义缓存时间

### 4. Spotify路由合并 + 路径变更

**决策**：合并为 `/api/spotify/now-playing` 和 `/api/spotify/available-devices`，同步更新前端。

**理由**：
- Spotify相关API归类更清晰
- 只有3处前端调用需要更新，风险可控
- 在同一个commit中完成API和前端更新

**Breaking Change缓解**：
- 迁移前搜索所有引用点
- 同步更新前端调用
- 迁移后端到端验证

### 5. 迁移策略：分4批次渐进式

**决策**：
- 第1批：基础架构 + Blog/Contact
- 第2批：简单GET路由（GitHub, Projects, Read Stats）
- 第3批：复杂路由（Views, Learn, Content, Comments）
- 第4批：Spotify路由 + 前端路径更新

**理由**：
- 每批可独立验证，风险分散
- 易于定位问题，可单独回滚
- 从简单到复杂，逐步建立信心

### 6. 响应格式：统一使用布尔值status

**决策**：成功 `{ status: true, data }`，失败 `{ status: false, error }`。

**理由**：
- 语义清晰（成功/失败，不是HTTP状态码）
- 与现有Blog API保持一致
- 前端判断更直观 `if (response.data.status)`

## Risks / Trade-offs

### 风险1: Spotify路径变更导致前端404
**影响**：如果遗漏前端调用更新，会导致组件报错
**缓解**：迁移前全面搜索引用点，同一commit完成所有更新

### 风险2: 中间状态的路由冲突
**影响**：分批次迁移期间，新旧路由可能共存
**缓解**：每批迁移后立即删除旧文件，避免中间状态

### 风险3: Contact API请求体bug修复影响
**影响**：从 `{ formData }` 改为 `{ name, email, message }` 是breaking change
**缓解**：已确认前端发送的是直接对象，实际是修复bug而非breaking change

### Trade-off: 无自动化测试
**选择**：本次重构不添加测试，采用手动验证
**理由**：重构范围大，添加测试会增加复杂度；现有功能可通过手动验证确保正确性
**后续**：建议后续为关键API添加单元测试

## Migration Plan

详见实施计划：`docs/superpowers/plans/2026-04-07-api-routes-unification.md`

**关键步骤**：
1. 创建基础架构（中间件、Hono主入口）
2. 逐批迁移路由，每批后立即验证
3. 更新前端Spotify路径调用
4. 清理所有旧文件
5. 最终端到端验证

**回滚策略**：
- 每批迁移独立commit，可单独revert
- 保留旧路由文件直到新路由验证通过
- 如出现问题，revert当前批次commit即可恢复

## Open Questions

无 - 所有设计决策已通过grill-mode深入讨论并确认。
