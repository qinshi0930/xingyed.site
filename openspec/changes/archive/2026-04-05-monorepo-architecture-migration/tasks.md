## 1. Cleanup & Preparation

- [x] 1.1 Remove `src/prisma` directory and `prisma.config.ts`.
- [x] 1.2 Uninstall unused dependencies (`pg`, `prisma`, `better-sqlite3`, etc.).
- [x] 1.3 Review and simplify `better-auth` configuration for non-database usage.

## 2. Monorepo Structure Initialization

- [x] 2.1 Create `apps` and `packages` directories at the root.
- [x] 2.2 Update `pnpm-workspace.yaml` to include new workspace patterns.
- [x] 2.3 Move existing project files into `apps/web`.

## 3. Shared Packages Setup

- [x] 3.1 Initialize `@repo/types` package with `BlogItemProps` and other shared interfaces.
- [x] 3.2 Initialize `@repo/utils` package with common utility functions.
- [x] 3.3 Configure `tsconfig.json` for each package to support path aliases.

## 4. Backend Service (apps/api) Creation

- [x] 4.1 Initialize Hono project in `apps/api` using Node.js runtime.
- [x] 4.2 Migrate service logic from `apps/web/src/services` to `apps/api/src/services`.
- [x] 4.3 Implement Hono routes corresponding to the old Next.js API routes.
- [x] 4.4 Configure CORS and environment variable handling for the API.

## 5. Web Application (apps/web) Refactoring

- [x] 5.1 Update `next.config.ts` and `tsconfig.json` paths to match new structure.
- [x] 5.2 Replace local API calls with requests to the new Hono backend endpoint.
- [x] 5.3 Update imports to use `@repo/types` and `@repo/utils` where applicable.

## 6. Root Configuration & Docker

- [x] 6.1 Create root `package.json` with `concurrently` scripts for development.
- [x] 6.2 Update `Dockerfile` to support multi-stage builds for both apps.
- [x] 6.3 Verify that `pnpm dev` successfully starts both frontend and backend.
