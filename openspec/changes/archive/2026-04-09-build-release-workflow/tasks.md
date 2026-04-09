## 1. Workflow 文件创建

- [x] 1.1 创建 `.github/workflows/build-release.yml` 文件
- [x] 1.2 配置 workflow 触发条件（`push.tags: 'v*'`）
- [x] 1.3 配置环境变量（`PNPM_VERSION: '10'`, `NODE_VERSION: '22'`）
- [x] 1.4 配置权限（`permissions.contents: write`）

## 2. 构建环境设置

- [x] 2.1 添加 Checkout code 步骤（`actions/checkout@v4`）
- [x] 2.2 添加 pnpm 设置步骤（`pnpm/action-setup@v2`）
- [x] 2.3 添加 Node.js 设置步骤（`actions/setup-node@v4`）
- [x] 2.4 添加依赖缓存步骤（`actions/cache@v4`）

## 3. 依赖安装与类型检查

- [x] 3.1 添加依赖安装步骤（`pnpm install --frozen-lockfile`）
- [x] 3.2 添加类型检查步骤（`pnpm --filter @repo/app exec tsc --noEmit`）
- [x] 3.3 验证类型检查不使用 secrets

## 4. Next.js 构建

- [x] 4.1 添加构建步骤（`pnpm build`）
- [x] 4.2 验证构建不使用 secrets
- [x] 4.3 添加构建产物验证步骤
- [x] 4.4 验证产物检查包含：`.next`、`BUILD_ID`、`standalone`、`server.js`

## 5. 产物压缩

- [x] 5.1 添加产物压缩步骤
- [x] 5.2 配置压缩命令（`zip -r` 在 standalone 目录内执行）
- [x] 5.3 配置产物命名为 `xingyed-site-${{ github.ref_name }}.zip`

## 6. GitHub Release 创建

- [x] 6.1 添加 Release 创建步骤（`softprops/action-gh-release@v2`）
- [x] 6.2 配置 Release 标题为 Tag 名称
- [x] 6.3 启用自动生成 Release Notes（`generate_release_notes: true`）
- [x] 6.4 配置产物上传（`files: xingyed-site-${{ github.ref_name }}.zip`）
- [x] 6.5 配置 `GITHUB_TOKEN` 环境变量

## 7. 验证与测试

- [x] 7.1 本地验证 YAML 语法正确性
- [x] 7.2 检查文件结构和权限配置
- [x] 7.3 创建测试 Tag（v0.0.1-test, v0.0.2-test, v0.0.3-test）
- [x] 7.4 推送测试 Tag 触发 workflow（三轮测试）
- [x] 7.5 验证 GitHub Actions 执行成功
- [x] 7.6 验证 Release 创建成功且包含产物
- [x] 7.7 清理测试 Tag 和 Release

## 8. 文档与提交

- [x] 8.1 提交所有更改到 Git
- [x] 8.2 创建设计文档和实施计划（docs/superpowers/）
- [x] 8.3 归档 OpenSpec 变更（2026-04-09）
