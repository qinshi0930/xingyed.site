## MODIFIED Requirements

### Requirement: API Data Fetching
The web application SHALL fetch data from the external Hono backend service instead of local Next.js API routes.

#### Scenario: Blog List Retrieval
- **WHEN** the blog page loads
- **THEN** it requests data from the `apps/api` endpoint (e.g., `http://localhost:3001/api/blog`)

### Requirement: Path Aliases
The `tsconfig.json` and `next.config.ts` SHALL be updated to reflect the new directory depth within `apps/web`.

#### Scenario: Absolute Imports
- **WHEN** a file uses `@/components/Button`
- **THEN** it correctly resolves to `apps/web/src/components/Button`
