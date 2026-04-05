## ADDED Requirements

### Requirement: Hono Service Initialization
The `apps/api` directory SHALL contain a standalone Hono application running on Node.js.

#### Scenario: API Server Start
- **WHEN** the API app is started
- **THEN** it listens on a configurable port (default 3001)

### Requirement: Third-party Integration Migration
All external API calls (GitHub, Spotify, ChatGPT) SHALL be moved from `src/services` to `apps/api/src/services`.

#### Scenario: GitHub Data Fetching
- **WHEN** a request is made to `/api/github`
- **THEN** the Hono service proxies the request to GitHub's GraphQL API using stored credentials
