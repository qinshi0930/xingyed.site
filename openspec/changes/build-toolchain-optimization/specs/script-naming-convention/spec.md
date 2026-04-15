## ADDED Requirements

### Requirement: App-prefixed script naming convention
Root-level package.json scripts SHALL use `app:` prefix for all commands that target the `@repo/app` application. This naming convention provides clarity and prepares for future multi-application monorepo expansion.

#### Scenario: Development script naming
- **WHEN** developer runs `bun run app:dev`
- **THEN** the command clearly indicates it targets the app workspace
- **THEN** Next.js development server starts with Turbopack

#### Scenario: Build script naming
- **WHEN** CI/CD or developer runs `bun run app:build`
- **THEN** the command clearly indicates it builds the app workspace
- **THEN** Next.js production build executes with Turbopack

#### Scenario: Start and lint scripts
- **WHEN** developer runs `bun run app:start` or `bun run app:lint`
- **THEN** commands target the `@repo/app` workspace
- **THEN** behavior is identical to previous naming but with explicit scope

### Requirement: Monorepo script organization
Scripts in root package.json SHALL use workspace filtering (`bun --filter @repo/app`) to delegate to application-specific commands.

#### Scenario: Workspace filter usage
- **WHEN** root script executes (e.g., `app:build`)
- **THEN** command uses `bun --filter @repo/app build`
- **THEN** only `@repo/app` workspace is affected
- **THEN** other packages (e.g., `@repo/types`, `@repo/utils`) are not invoked

#### Scenario: Future multi-app readiness
- **WHEN** new application is added (e.g., `apps/admin`)
- **THEN** naming convention allows adding `admin:dev`, `admin:build`, etc.
- **THEN** no naming conflicts with existing `app:*` scripts
- **THEN** root scripts remain organized and scalable

### Requirement: CI/CD configuration alignment
CI/CD workflow files SHALL use the new `app:*` script names consistently.

#### Scenario: GitHub Actions lint job
- **WHEN** CI/CD pipeline executes lint step
- **THEN** command uses `bun run app:lint`
- **THEN** linting runs on `@repo/app` workspace only

#### Scenario: GitHub Actions build job
- **WHEN** CI/CD pipeline executes build step
- **THEN** command uses `bun run app:build`
- **THEN** build produces standalone output with Turbopack

### Requirement: Vercel deployment configuration alignment
Vercel configuration SHALL use the new `app:build` script name for build commands.

#### Scenario: Vercel build trigger
- **WHEN** Vercel triggers a deployment
- **THEN** `vercel.json` specifies `"buildCommand": "bun run app:build"`
- **THEN** build succeeds using new script naming

#### Scenario: Vercel install command
- **WHEN** Vercel installs dependencies
- **THEN** `vercel.json` specifies `"installCommand": "bun install"`
- **THEN** Bun package manager is used (not pnpm)
