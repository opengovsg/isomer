# @opengovsg/isomer-components

Published React component library providing the rendering engine, UI components, Zod schemas, and utilities for Isomer sites. Consumed by `apps/studio` and published to GitHub npm registry.

## Key exports

- `RenderEngine` — renders page content from JSON blobs
- Zod schemas for all component and page types (used for AJV validation in studio)
- TypeScript types for all content structures
- One template export: `@opengovsg/isomer-components/templates/next`

## Themes

`site.theme` selects rendering and CSS; the site's brand palette is independent.
Next supplies the default blocks, layouts, and site chrome. Entries in
`src/themes/overrides.ts` replace selected implementations using the same props.
Overrides must preserve content, actions, accessibility, and the meaning of
presentation props. Shared Storybook cases and behavioural tests check that
contract; TypeScript checks the interfaces, not visual semantics.

Register theme metadata in `src/themes/index.ts`, implementations in
`src/themes/overrides.ts`, and its preset in `src/presets/theme.ts`. A theme's
preset must include the utilities needed by inherited implementations. Keep
breakpoints aligned with `useBreakpoint` when sharing responsive components.
The default implementation files remain under `templates/next` to avoid a
directory-wide move.

Studio's `build:preview-tw` compiles one stylesheet per theme and loads the
selected stylesheet inside its preview iframe. Storybook compiles independent
CSS entry points with Vite, activates one per preview document, and uses iframes
for Docs stories. Published sites compile the selected preset and
retain site colours through `isomerSiteTheme`. Build consumers can import
`/themes` and `/presets` without loading the rendering engine.

Classic is a **development reference**, not a publishable theme. Its Infopic
was recovered from `d6aa299a5^` and adapted to today's props; its other blocks,
layouts, and full-image Infopic variant inherit the defaults. The historical
Classic page renderer was incomplete. Admin configuration and published builds
reject development-only themes until they are ready for release.

## Source layout

```
src/
  engine/       - RenderEngine and metadata helpers
  schemas/      - Zod schemas for pages and components
  templates/    - next template
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
