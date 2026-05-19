# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Isomer Next is a monorepo for a government CMS/site builder platform (Open Government Products, Singapore). It uses Turborepo with pnpm workspaces.

## Common Commands

### Development
```bash
pnpm dev              # Start all dev servers
pnpm storybook        # Start Storybook in multiple workspaces (e.g. Studio on 6007, Components on 6006)
pnpm watch:packages   # Watch and rebuild packages
```

### Testing
```bash
# From root
pnpm test:e2e         # Run Playwright E2E tests
pnpm dev:e2e          # Start dev server + run E2E tests

# From apps/studio
pnpm test:unit        # Run Vitest unit tests
pnpm test:watch       # Watch mode for unit tests
pnpm exec playwright test tests/e2e/specific-test.spec.ts  # Run single E2E test
pnpm test:unit -- src/path/to/test.test.ts                 # Run single unit test
```

### Code Quality
```bash
pnpm lint             # Run Oxlint (type-aware)
pnpm lint:fix         # Fix lint issues
pnpm format           # Check formatting (Oxfmt)
pnpm format:fix       # Fix formatting
pnpm typecheck        # TypeScript type checking
```

### Database (from apps/studio)
```bash
pnpm setup            # Full setup: docker, migrations, seed
pnpm services:setup   # Start PostgreSQL and Mockpass containers
pnpm migrate:dev      # Create new migration
pnpm db:seed          # Seed database
pnpm db:reset         # Reset database
pnpm generate         # Regenerate Prisma client
```

### Building
```bash
pnpm build            # Build all packages
pnpm build:template   # Build template package
pnpm clean            # Clean build artifacts
```

## Architecture

### Monorepo Structure
- `apps/studio` - Main Next.js 15 application (CMS/site builder)
- `packages/components` - Reusable component library (@opengovsg/isomer-components)
- `packages/pgboss` - Job queue wrapper (@isomer/pgboss)
- `tooling/*` - Shared configs (TypeScript, Oxlint, Storybook)

### Studio App (`apps/studio/src`)
- `pages/` - Next.js pages and API routes
- `server/` - tRPC routers and server logic
- `features/` - Feature modules (editing, dashboard, etc.)
- `components/` - React components
- `hooks/` - Custom React hooks
- `lib/` - Utilities and helpers
- `schemas/` - Zod validation schemas
- `theme/` - Chakra UI theme configuration

### Key Technologies
- **Framework**: Next.js 15, React 18
- **API**: tRPC for type-safe client-server communication
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS + Chakra UI
- **Rich Text**: TipTap editor
- **State**: Jotai, React Query
- **Testing**: Vitest (unit), Playwright (E2E)
- **Linting**: Oxlint with type-aware checking
- **Formatting**: Oxfmt

### Database
- Schema: `apps/studio/prisma/schema.prisma`
- Migrations: `apps/studio/prisma/migrations/`
- Custom migrations: `apps/studio/prisma/custom/`

## Testing Notes

- E2E tests are in `apps/studio/tests/e2e/`
- Unit tests use `.test.ts` extension alongside source files
- E2E tests require `pnpm setup:test` first (starts Docker services)
- Tests use `.env.test` for environment variables

## Environment Setup

1. Copy `apps/studio/.env.example` to `apps/studio/.env`
2. Get secrets from 1Password (search "Isomer Next")
3. Run `pnpm setup` from `apps/studio` to start services and seed DB

## Formatting Configuration

The project uses Oxfmt with Tailwind CSS class sorting. VSCode is configured to format on save with Oxc extension.
