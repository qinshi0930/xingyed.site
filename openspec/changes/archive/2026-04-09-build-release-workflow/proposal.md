## Why

当前项目缺少自动化的构建和 Release 发布流程。每次发布版本需要手动编译、打包和创建 GitHub Release，效率低且容易出错。需要一个基于 Git Tag 触发的自动化 workflow，实现编译、打包和 Release 创建的一键发布。

## What Changes

- 新增 `.github/workflows/build-release.yml` workflow 文件
- 监听 Git Tag 推送事件（格式 `v*`）自动触发
- 执行完整的构建流程：类型检查 → Next.js 构建 → 产物验证
- 压缩 standalone 产物为 zip 文件
- 自动创建 GitHub Release 并上传构建产物
- 使用 GitHub 自动生成的 Release Notes

## Capabilities

### New Capabilities

- `build-release-workflow`: GitHub Actions 构建和 Release 发布流程，包括编译、打包、产物验证和 Release 创建的完整自动化

### Modified Capabilities

<!-- 无现有能力需要修改 -->

## Impact

- **新增文件**: `.github/workflows/build-release.yml`
- **GitHub Secrets**: 无需新增 secrets（简化版本不使用 GitHub API）
- **GitHub 权限**: 需要 `contents: write` 权限以创建 Release
- **依赖**: `softprops/action-gh-release@v2` Action
- **构建环境**: Node.js 22, pnpm 10, Ubuntu latest
