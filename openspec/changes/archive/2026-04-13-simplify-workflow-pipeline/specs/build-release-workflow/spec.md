## REMOVED Requirements

### Requirement: 独立 Build-Release Workflow
**Reason**: 从独立 workflow 改为统一 `ci-cd.yml` 中的条件 job，解决 artifact 跨域问题
**Migration**: Release 逻辑迁移至 `ci-cd.yml` 的 release job，通过 `if: startsWith(github.ref, 'refs/tags/')` 条件控制

### Requirement: Workflow 触发条件（独立）
**Reason**: 触发条件统一在 `ci-cd.yml` 中管理
**Migration**: 不再需要独立的 tag 触发配置，由主 workflow 统一处理
