# Guestbook 体验打磨设计

## 1. 目标

在不影响现有功能的前提下，为 guestbook 模块增加四项体验增强：

1. **无限滚动分页** — Intersection Observer 触底自动加载
2. **Optimistic Update** — 提交留言后立即显示，零延迟感知
3. **骨架屏** — 替换"加载中..."文字为 MessageItem 形状的 Skeleton
4. **相对时间** — dayjs fromNow + shadcn Tooltip 显示完整时间

## 2. 架构变更

### 2.1 状态提升

当前 `MessageList` 自持 `messages` 状态，每次 `refreshKey` 变化时重新挂载并 fetch。
为支持 Optimistic Update + 无限滚动 + Realtime 去重，需要将 messages 状态提升到 `Guestbook` 容器：

```
Guestbook（orchestrator）
├── messages: GuestbookMessage[]     ← 提升
├── total: number                    ← 新增（服务端总数）
├── isLoadingMore: boolean           ← 新增
├── hasMore: boolean                 ← 派生：messages.length < total
├── loadMore()                       ← 新增：offset += PAGE_SIZE
├── handleOptimisticAdd(tempMsg)     ← 新增
├── handleOptimisticConfirm(tempId, realMsg) ← 新增
├── handleOptimisticRevert(tempId)   ← 新增
│
├── MessageForm
│   └── onSubmit → optimistic flow
├── RealtimeListener
│   └── onInsert → dedup + prepend
└── MessageList
    └── 纯展示 + sentinel div
```

### 2.2 分页策略

- `PAGE_SIZE = 20`
- 首次加载 20 条 → 触底加载下 20 条 → 直到 `messages.length >= total`
- 使用 `useIntersectionObserver`（来自 `usehooks-ts`，已安装）
- sentinel div 在列表末尾，进入视口时触发 `loadMore()`
- 防抖：`isLoadingMore` 为 true 时不重复触发

### 2.3 Optimistic Update 流程

```
用户点击提交
    │
    ├─→ 构造临时消息 { ...fields, id: crypto.randomUUID(), _optimistic: true }
    ├─→ prepend 到 messages 顶部（立即渲染，半透明样式）
    ├─→ 清空输入框 + setIsSubmitting(false)
    │
    ├─→ apiFetch POST /api/guestbook
    │       │
    │       ├── 成功 → 用 realMsg 替换临时消息（by _tempId match）
    │       │         total += 1
    │       │
    │       └── 失败 → 移除临时消息 + toast 已由 apiFetch 处理
    │
    └─→ Realtime INSERT 事件到达
            └── 检查 message.id 是否已在列表中（刚被 confirm 替换过）
                ├── 已存在 → 忽略（不重复 toast）
                └── 不存在 → prepend + toast "收到新留言"
```

**临时消息类型扩展**：

```ts
interface OptimisticGuestbookMessage extends GuestbookMessage {
  _optimistic?: boolean;
}
```

### 2.4 骨架屏

创建 `MessageItemSkeleton` 组件，模拟 MessageItem 布局：

```
┌──────────────────────────────────────────┐
│ [○ avatar]  [████████ name] [███ time]   │
│             [██████████████████████████]  │
│             [███████████████]             │
└──────────────────────────────────────────┘
```

使用场景：

- 首次加载：显示 5 个 skeleton
- 加载更多：底部显示 2 个 skeleton

### 2.5 相对时间

- 使用已有的 `formatRelativeTime()` from `@/common/libs/utils/time`
- Hover 显示完整时间，使用 shadcn/ui 的 `Tooltip` 组件
- 格式：
  - 默认：`fromNow()`（如 "3 分钟前"、"2 小时前"、"3 天前"）
  - Hover tooltip：`YYYY-MM-DD HH:mm:ss`

## 3. 涉及文件

| 文件                                                                | 操作                                                  |
| ------------------------------------------------------------------- | ----------------------------------------------------- |
| `apps/app/src/modules/guestbook/index.tsx`                          | 重写：提升 messages 状态 + 分页逻辑 + optimistic 处理 |
| `apps/app/src/modules/guestbook/components/MessageList.tsx`         | 重写：纯展示 + sentinel + skeleton                    |
| `apps/app/src/modules/guestbook/components/MessageForm.tsx`         | 修改：接入 optimistic 回调                            |
| `apps/app/src/modules/guestbook/components/MessageItem.tsx`         | 修改：相对时间 + optimistic 样式                      |
| `apps/app/src/modules/guestbook/components/MessageItemSkeleton.tsx` | 新建                                                  |
| `apps/app/src/modules/guestbook/components/RealtimeListener.tsx`    | 修改：接入 dedup 逻辑                                 |
| `apps/app/src/common/types/guestbook.ts`                            | 修改：添加 OptimisticGuestbookMessage                 |

## 4. 设计决策

| 决策                  | 选择                                 | 理由                                             |
| --------------------- | ------------------------------------ | ------------------------------------------------ |
| 状态管理              | 提升到 Guestbook                     | Optimistic + 分页 + Realtime 三者需共享 messages |
| Intersection Observer | `usehooks-ts`                        | 已安装，无额外依赖                               |
| Tooltip               | shadcn/ui Tooltip                    | 已集成，与项目风格一致                           |
| 相对时间              | 复用 `formatRelativeTime`            | 已存在、已配置 relativeTime 插件                 |
| Optimistic 标识       | `_optimistic` 布尔字段               | 最简单，类型安全                                 |
| Realtime 去重         | 检查 message.id 是否已在 messages 中 | 避免 optimistic confirm 后重复渲染               |
| 骨架屏组件            | 独立文件                             | 职责单一，可复用                                 |

## 5. 验收标准

| 标准                           | 验证方式                        |
| ------------------------------ | ------------------------------- |
| 首次加载显示 5 个骨架屏        | 浏览器观察                      |
| 加载 20 条后触底自动加载下一页 | 滚动测试                        |
| 留言提交后立即显示（半透明）   | 浏览器观察                      |
| API 成功后临时消息变实色       | 浏览器观察                      |
| API 失败后临时消息消失         | 模拟 500                        |
| 时间显示为相对格式             | 浏览器观察                      |
| Hover 时间显示完整日期         | 鼠标悬停                        |
| Realtime 不重复推送自己的留言  | 双浏览器测试                    |
| TypeScript 类型检查通过        | `bun x tsc --noEmit`            |
| ESLint + build 全绿            | `bun run lint && bun run build` |

## 6. 不在范围

- 分页 UI（页码组件）
- 虚拟滚动（留言量远未到需要的程度）
- Markdown 渲染
- Rate limiting
