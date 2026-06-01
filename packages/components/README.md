# @opengovsg/isomer-components

Published React component library providing the rendering engine, UI components, Zod schemas, and utilities for Isomer sites. Consumed by `apps/studio` and published to GitHub npm registry.

## Key exports

- `RenderEngine` — renders page content from JSON blobs
- Zod schemas for all component and page types (used for AJV validation in studio)
- TypeScript types for all content structures
- Two template exports: `@opengovsg/isomer-components/templates/classic` and `/templates/next`

## Source layout

```
src/
  engine/       - RenderEngine and metadata helpers
  schemas/      - Zod schemas for pages and components
  templates/    - classic and next templates
  interfaces/   - TypeScript interfaces (complex, integration, internal, native)
  hooks/        - useBreakpoint, useDgsData, useQueryParams, etc.
  utils/        - 30+ utility files (import individually, not from barrel)
  stories/      - Storybook stories
```

**Restricted imports:** Do not import from `~/utils` barrel — import individual utils directly (enforced by Oxlint).

## Commands

```bash
pnpm build        # dual CJS + ESM output to dist/
pnpm dev          # tsc watch mode
pnpm test:unit
pnpm test:watch
pnpm lint         # oxlint --type-aware
pnpm lint:fix
pnpm format       # oxfmt --check
pnpm format:fix
pnpm storybook    # port 6006
```

## Build system

Produces dual CJS (`dist/cjs/`) + ESM (`dist/esm/`) output. Path alias `~` maps to `./src`. `tsc-alias` resolves the alias after compilation.

Clean build artifacts with `git clean -xdf dist/` — do not commit `dist/`.

## Testing

Vitest unit tests + Storybook/Chromatic visual tests. Istanbul coverage (`pnpm test:unit -- --coverage`).

## Tooling

- **Linting**: `@isomer/oxlint-config` (Rust-based Oxlint, type-aware)
- **Formatting**: Oxfmt (Rust formatter)
- **TypeScript**: `@isomer/tsconfig` base config, strict mode, bundler module resolution
- **Turbo**: Build outputs cached under `dist/**`
