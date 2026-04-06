## ADDED Requirements

### Requirement: Workspace Configuration
The project SHALL be configured as a pnpm workspace with `apps/*` and `packages/*` patterns.

#### Scenario: Workspace Initialization
- **WHEN** `pnpm install` is run at the root
- **THEN** dependencies for all apps and packages are linked correctly

### Requirement: Root-level Scripts
The root `package.json` SHALL provide scripts to manage the entire monorepo lifecycle.

#### Scenario: Development Start
- **WHEN** `pnpm dev` is executed
- **THEN** both `apps/web` and `apps/api` start in parallel using `concurrently`
