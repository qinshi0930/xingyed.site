## ADDED Requirements

### Requirement: Types Package
A `@repo/types` package SHALL be created to house all shared TypeScript interfaces and constants.

#### Scenario: Shared Blog Type
- **WHEN** a component in `apps/web` needs blog data structure
- **THEN** it imports `BlogItemProps` from `@repo/types` instead of a local path

### Requirement: Utils Package
A `@repo/utils` package SHALL be created for pure utility functions.

#### Scenario: Date Formatting
- **WHEN** a date string needs formatting
- **THEN** the logic is imported from `@repo/utils` to ensure consistency across apps
