# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Isomer Next is a monorepo for a government CMS/site builder platform (Open Government Products, Singapore). It uses Turborepo with npm workspaces.

## Common Commands

### Development
```bash
npm run dev              # Start all dev servers
npm run storybook        # Start Storybook on port 6007
npm run watch:packages   # Watch and rebuild packages
```

### Testing
```bash
# From root
npm run test:e2e         # Run Playwright E2E tests
npm run dev:e2e          # Start dev server + run E2E tests

# From apps/studio
npm run test:unit        # Run Vitest unit tests
npm run test:watch       # Watch mode for unit tests
npx playwright test tests/e2e/specific-test.spec.ts  # Run single E2E test
npm run test:unit -- src/path/to/test.test.ts        # Run single unit test
```

### Code Quality
```bash
npm run lint             # Run Oxlint (type-aware)
npm run lint:fix         # Fix lint issues
npm run format           # Check formatting (Oxfmt)
npm run format:fix       # Fix formatting
npm run typecheck        # TypeScript type checking
```

### Database (from apps/studio)
```bash
npm run setup            # Full setup: docker, migrations, seed
npm run services:setup   # Start PostgreSQL and Mockpass containers
npm run migrate:dev      # Create new migration
npm run db:seed          # Seed database
npm run db:reset         # Reset database
npm run generate         # Regenerate Prisma client
```

### Building
```bash
npm run build            # Build all packages
npm run build:template   # Build template package
npm run clean            # Clean build artifacts
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
- E2E tests require `npm run setup:test` first (starts Docker services)
- Tests use `.env.test` for environment variables

## Environment Setup

1. Copy `apps/studio/.env.example` to `apps/studio/.env`
2. Get secrets from 1Password (search "Isomer Next")
3. Run `npm run setup` from `apps/studio` to start services and seed DB

## Formatting Configuration

The project uses Oxfmt with Tailwind CSS class sorting. VSCode is configured to format on save with Oxc extension.
