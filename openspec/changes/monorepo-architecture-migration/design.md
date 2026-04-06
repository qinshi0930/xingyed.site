## Context

The project is currently a monolithic Next.js application. All business logic, UI components, and API routes reside within the `src` directory. The project uses pnpm but lacks workspace configuration. There are unused database dependencies (Prisma, pg) that add unnecessary complexity.

## Goals / Non-Goals

**Goals:**
- Establish a clear Monorepo structure using pnpm workspaces.
- Decouple the backend logic into a standalone Hono service.
- Centralize shared types and utilities to prevent code duplication.
- Simplify the dependency tree by removing unused database tools.

**Non-Goals:**
- Migrating the frontend away from Next.js.
- Introducing complex microservices orchestration (e.g., Kubernetes) at this stage.
- Rewriting existing business logic; the focus is on structural migration.

## Decisions

1.  **Tooling**: Use **pnpm workspaces** for dependency management and **concurrently** for process management. This avoids the overhead of heavier tools like Turborepo while providing excellent performance.
2.  **Backend Runtime**: Use **Node.js** for the Hono service to maintain compatibility with existing libraries like `pg` (if re-introduced) and `jsonwebtoken`.
3.  **Shared Packages**: Split into `@repo/types` and `@repo/utils`. This ensures that frontend-only packages don't pull in heavy backend dependencies.
4.  **MDX Handling**: Keep MDX parsing on the frontend (`apps/web`). The backend (`apps/api`) will only serve raw file content or metadata, keeping the API lightweight.
5.  **Deployment**: Use a **single Docker image** with a multi-stage build. The production container will run both the Next.js server and the Hono server using `concurrently`.

## Risks / Trade-offs

- **[Risk] Path Alias Complexity**: Moving files deep into `apps/web` can break absolute imports. 
  - *Mitigation*: Rigorously update `tsconfig.json` and `next.config.ts` paths during the move.
- **[Risk] Cross-Origin Issues**: Separating frontend and backend ports in development.
  - *Mitigation*: Configure CORS in Hono and use environment variables to manage base URLs dynamically.
- **[Trade-off] Single Image Deployment**: Running two processes in one container is less scalable than separate services.
  - *Mitigation*: For a personal blog, this trade-off is acceptable for the sake of deployment simplicity.
