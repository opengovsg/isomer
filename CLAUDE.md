# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Scoped context

Before working in a directory, read and follow every `CLAUDE.md` in or above
that directory. Nested files add area-specific guidance to this root file.

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
pnpm exec playwright test tests/e2e/smoke.test.ts          # Run single E2E test
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
pnpm run setup        # Full setup: docker, migrations, seed
pnpm services:setup   # Start PostgreSQL and Mockpass containers
pnpm migrate:dev      # Create new migration
pnpm db:seed          # Seed database
pnpm db:reset         # Reset database
pnpm generate         # Regenerate Prisma client
```

### Production database safety

- **Never run `pnpm db:connect`, `pnpm run db:connect`, or an equivalent
  production database connection command.** This is an absolute prohibition
  for agents and automation, including read-only work and attempts to inspect
  the command with `--help` or `--dry-run`.
- Do not invoke `apps/studio/scripts/connectRds.sh prod` directly or create an
  equivalent SSH, bastion, port-forwarding, or assumed-role connection to the
  production database.
- If production database access appears necessary, stop and ask the developer
  to perform the operation themselves or provide a safe local/non-production
  alternative.
- Access to any other remote environment, credentials, secrets, decrypted
  parameters, database, or tunnel requires the user's explicit permission in
  advance, even for read-only work.

### Building
```bash
pnpm build            # Build all packages
pnpm build:template   # Build template package
pnpm clean            # Clean build artifacts
```

## Architecture

### Monorepo Structure
- `apps/studio` - Main Next.js 16 application (CMS/site builder)
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
- **Framework**: Next.js 16, React 18
- **API**: tRPC for type-safe client-server communication
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS + Chakra UI
- **Rich Text**: TipTap editor
- **State**: Jotai, React Query
- **Testing**: Vitest (unit), Playwright (E2E)
- **Linting**: Oxlint with type-aware checking
- **Formatting**: Oxfmt

### Database
- Schema: `packages/db/prisma/schema.prisma`
- Migrations: `packages/db/prisma/migrations/`
- Custom migrations: `packages/db/prisma/custom/`
- Generated Kysely types: `packages/db/src/generated/`

## Testing Notes

- E2E tests are in `apps/studio/tests/e2e/`
- Unit tests use `.test.ts` extension alongside source files
- E2E tests require `pnpm setup:test` first (starts Docker services)
- Tests use `.env.test` for environment variables

## Environment Setup

1. Copy `apps/studio/.env.example` to `apps/studio/.env`
2. Get secrets from 1Password (search "Isomer Next")
3. Run `pnpm run setup` from `apps/studio` to start services and seed DB

## Storybook MCP (AI agents)

Storybook exposes an MCP server when the dev server is running (`pnpm storybook` from the repo root starts Components on port **6006** and Studio on **6007**). HTTP endpoints are listed in the repo-root **`.mcp.json`** (project-scoped MCP config used by Claude Code and other agents).

- **isomer-components-sb-mcp** — published-site components (`packages/components`)
- **isomer-studio-sb-mcp** — Studio UI stories (`apps/studio`)

Register those servers in your agent (after `pnpm storybook` is running). Examples: Claude Code reads `.mcp.json` directly; for other tools, copy the `mcpServers` entries into the path your agent expects, or run `npx mcp-add --type http --url "http://localhost:6006/mcp" --scope project` (repeat for port 6007) per [Storybook MCP setup](https://storybook.js.org/docs/ai/mcp/overview).

Start Storybook before connecting an agent. Open `http://localhost:6006/mcp` or `http://localhost:6007/mcp` in a browser to confirm the MCP addon is up.

When working on UI components or stories, use the Storybook MCP tools for the relevant workspace **before** implementing or answering:

- **CRITICAL: Do not invent component props.** Before using any prop on a design-system or shared component, call `docs-list` and `docs-show` for that component and only use documented props or props shown in example stories.
- Use `get-storybook-story-instructions` when creating or updating stories.
- Validate with `test-run` when the testing toolset is available.

Story conventions that improve MCP manifests: one concept per story, JSDoc on components and props, and `react-docgen-typescript` (already configured in Storybook). Exclude anti-pattern or deprecated demos from the manifest with Storybook’s `manifest` tag when needed.

Docs: [Storybook MCP overview](https://storybook.js.org/docs/ai/mcp/overview), [setup](https://storybook.js.org/docs/ai/setup), [best practices](https://storybook.js.org/docs/ai/best-practices).

## Formatting Configuration

The project uses Oxfmt with Tailwind CSS class sorting. VSCode is configured to format on save with Oxc extension.
