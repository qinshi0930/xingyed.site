## Why

The current project structure mixes frontend UI, backend API routes, and shared logic in a single monolithic directory. As the project grows, this makes it difficult to scale, maintain clear boundaries between concerns, and reuse logic across different parts of the system. Migrating to a Monorepo architecture using pnpm workspaces will provide better modularity, clearer separation of concerns, and a foundation for future multi-app expansion.

## What Changes

- **Restructure Directory**: Move existing code into `apps/web` and create `apps/api` for a standalone Hono backend.
- **Extract Shared Logic**: Create `@repo/types` and `@repo/utils` packages to centralize TypeScript definitions and utility functions.
- **Decouple Backend**: Migrate Next.js API Routes to an independent Hono service running on Node.js.
- **Clean Up Dependencies**: Remove unused Prisma and database-related dependencies as the project currently relies on MDX files and external APIs.
- **Update Build Process**: Implement `concurrently` to manage parallel development of frontend and backend services.

## Capabilities

### New Capabilities
- `monorepo-workspace`: Configuration for pnpm workspaces, root-level tooling, and shared infrastructure.
- `backend-service`: A standalone Hono-based API service handling third-party integrations (GitHub, Spotify, etc.) and acting as a BFF.
- `shared-packages`: Reusable packages for types (`@repo/types`) and utilities (`@repo/utils`).

### Modified Capabilities
- `web-application`: The existing Next.js application will be refactored to consume the new backend service instead of local API routes.

## Impact

- **Codebase Structure**: Significant changes to directory layout and import paths.
- **Build & Deploy**: Dockerfile and CI/CD pipelines must be updated to support multi-app builds.
- **Environment Variables**: API keys and secrets will need to be managed separately for `apps/web` and `apps/api`.
- **Data Flow**: Frontend components will switch from fetching `/api/...` to calling the external Hono service endpoint.
