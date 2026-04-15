## 1. 应用层脚本更新

- [x] 1.1 修改 `apps/app/package.json` 的 dev 命令：`bun --bun next dev` → `next dev --turbopack`
- [x] 1.2 修改 `apps/app/package.json` 的 build 命令：`bun --bun next build` → `next build --turbopack`
- [x] 1.3 修改 `apps/app/package.json` 的 start 命令：`bun --bun next start` → `next start`

## 2. 根目录脚本命名规范化

- [x] 2.1 修改根目录 `package.json` 的 dev 脚本：`dev` → `app:dev`
- [x] 2.2 修改根目录 `package.json` 的 build 脚本：`build` → `app:build`
- [x] 2.3 修改根目录 `package.json` 的 start 脚本：`start` → `app:start`
- [x] 2.4 修改根目录 `package.json` 的 lint 脚本：`lint` → `app:lint`
- [x] 2.5 更新 docker:build 和 docker:deploy 脚本引用 `app:build`

## 3. CI/CD 配置更新

- [x] 3.1 更新 `.github/workflows/ci-cd.yml` lint 步骤：`bun run lint` → `bun run app:lint`
- [x] 3.2 更新 `.github/workflows/ci-cd.yml` build 步骤：`bun run build` → `bun run app:build`

## 4. Vercel 配置更新

- [x] 4.1 更新 `vercel.json` 的 buildCommand：`bun run build` → `bun run app:build`

## 5. 基准测试与验证

- [x] 5.1 创建构建耗时对比测试脚本 `scripts/benchmark-build.sh`
- [x] 5.2 运行 Webpack vs Turbopack 性能对比测试
- [x] 5.3 记录测试结果：Webpack 96.4s vs Turbopack 41.4s（提升 57%）
- [x] 5.4 记录产物大小对比：Webpack 102kB vs Turbopack 237kB（增加 132%）

## 6. 文档更新

- [x] 6.1 更新 README.md 中的开发指南，使用新的脚本名称

## 7. 生产环境验证

- [x] 7.1 在暂存环境部署并验证功能正常
