# Move `isomer-next-playground` into `apps/playground`

Spec for absorbing the standalone Vite playground into the Isomer Next monorepo as a first-class workspace app. **Planning artifact only** — no implementation in this effort.

## Destination

`playground` lives at `apps/playground/`, runs via `pnpm --filter playground dev`, depends on `@opengovsg/isomer-components` through the workspace (not a vendored `.tgz`), and passes the monorepo's lint/format/typecheck/build pipeline. Deploy is via Vercel integration (not monorepo CI deploy).

## Decisions (locked)

| #   | Decision                                             | Answer                                                                                                                                                                                                                                                                                                                         |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Integration depth                                    | **Full monorepo citizen** — pnpm, `workspace:*`, oxlint/oxfmt, turbo tasks, lint/format/typecheck in CI. Deploy via Vercel, not CI.                                                                                                                                                                                            |
| D2  | Package / directory name                             | Directory: `apps/playground`. Package name: `playground`.                                                                                                                                                                                                                                                                      |
| D3  | Nested git repo                                      | Remove nested `.git` before PR lands.                                                                                                                                                                                                                                                                                          |
| D4  | Git history import                                   | **Squash** — single commit; no history import needed.                                                                                                                                                                                                                                                                          |
| D5  | External repo (`isomerpages/isomer-next-playground`) | **Out of scope** — owner will clean up manually.                                                                                                                                                                                                                                                                               |
| D6  | Components dependency                                | `workspace:*` on `@opengovsg/isomer-components` (resolves to `packages/components`); delete vendored `.tgz`. **No import/script changes** — `generate-schema.ts`, `Preview.tsx`, and `tailwind.config.js` already import `@opengovsg/isomer-components` by package name. Turbo `dependsOn: ["^build"]` on build/dev/typecheck. |
| D7  | TipTap                                               | **Migrate to v3** as part of the move PR (use monorepo catalog entries).                                                                                                                                                                                                                                                       |
| D8  | Root `pnpm dev`                                      | **Never starts playground.** Root `dev` stays studio-only (e.g. `turbo run dev --filter=isomer-studio`). Playground: `pnpm --filter playground dev`.                                                                                                                                                                           |
| D9  | CI                                                   | Include playground in root lint/format/typecheck/build via turbo. Paths-filter: **defer** until after move lands.                                                                                                                                                                                                              |
| D10 | `0.1.0.json` consumers                               | **Not actively used** — keep current filename/behaviour for the move; no redirect or publish step required.                                                                                                                                                                                                                    |

## What the playground is today

| Aspect         | Current state                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Location       | `isomer-next-playground/` at monorepo root (copy in workspace; target is `apps/playground`)                |
| Upstream       | `https://github.com/isomerpages/isomer-next-playground` (nested `.git`)                                    |
| Package name   | `isomer-test`                                                                                              |
| Stack          | Vite 5, React 18, TypeScript, Tailwind, ESLint, **npm** (`package-lock.json`)                              |
| Components dep | `file:opengovsg-isomer-components-0.0.13.tgz` (pinned, stale)                                              |
| Size           | ~200 LOC across `src/` (Editor + Preview + sample JSON)                                                    |
| Purpose        | Live JSON editor + preview for Isomer page schemas; `scripts/generate-schema.ts` emits `public/0.1.0.json` |
| Deployment     | Vercel (to be wired after move)                                                                            |

### Key coupling to `packages/components`

- `Preview.tsx` imports `RenderEngine` and `IsomerComponent` from `@opengovsg/isomer-components`.
- `generate-schema.ts` imports `schema` from the same package and writes `public/0.1.0.json`.
- Editor validates user JSON against that schema at runtime (`/0.1.0.json`).

The playground is effectively a thin UI over the components package schema — it should always track workspace `packages/components`, not a hand-vendored tarball.

### D6 — How workspace linking works (no path imports)

Do **not** import from `@packages/components/` or a relative path into `packages/components/src`. Use the published package name, same as studio:

```json
"@opengovsg/isomer-components": "workspace:*"
```

pnpm resolves that to `packages/components`. The package only exposes built output (`dist/esm/`), so components must be built before playground dev/build:

```bash
pnpm --filter @opengovsg/isomer-components build
pnpm --filter playground dev
```

Existing imports are already correct and need no changes:

```typescript
// scripts/generate-schema.ts
import { schema } from "@opengovsg/isomer-components"

// src/components/Preview/Preview.tsx
import {
  RenderEngine,
  type IsomerComponent,
} from "@opengovsg/isomer-components"

// tailwind.config.js
import { isomerSiteTheme, NextPreset } from "@opengovsg/isomer-components"
```

Delete `opengovsg-isomer-components-0.0.13.tgz` and update `tailwind.config.js` content paths from `./node_modules/@opengovsg/isomer-components/...` to the workspace symlink (still under `node_modules/@opengovsg/isomer-components/` after `pnpm install` — path stays the same).

## Implementation details

### Toolchain alignment (D1, D7)

| Concern         | Today                      | Target                                                                                                                              |
| --------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Package manager | npm                        | pnpm (delete `package-lock.json`)                                                                                                   |
| Lint            | ESLint 8 + `.eslintrc.cjs` | oxlint via `@isomer/oxlint-config`                                                                                                  |
| Format          | none                       | oxfmt (root config)                                                                                                                 |
| TypeScript      | local `tsconfig.json`      | extend root `tsconfig.json` where possible                                                                                          |
| Deps versions   | hand-pinned                | `catalog:` entries from root `pnpm-workspace.yaml` where overlaps exist (react, tiptap, jsonforms, ajv, tailwind, vite, typescript) |
| TipTap          | v2                         | **v3** via catalog (part of move PR)                                                                                                |

**MUI + Monaco:** playground-only deps, not in monorepo catalog. Keep as direct deps.

### Turbo tasks (D8)

Add to `apps/playground/package.json`:

| Script                  | Behaviour                                             |
| ----------------------- | ----------------------------------------------------- |
| `dev`                   | `vite` (persistent; no DB/docker deps)                |
| `build`                 | `tsc && vite build && tsx scripts/generate-schema.ts` |
| `generate`              | `tsx scripts/generate-schema.ts` (optional)           |
| `lint` / `lint:fix`     | oxlint                                                |
| `format` / `format:fix` | oxfmt                                                 |
| `typecheck`             | `tsc --noEmit`                                        |
| `clean`                 | remove `dist`, `.turbo`, `node_modules`               |

**Root `dev` exclusion:** update root `package.json` so `pnpm dev` does not pick up playground:

```json
"dev": "dotenv -- turbo run dev --filter=isomer-studio"
```

Playground `dev` override in `turbo.json` (no `services:setup`):

```json
"playground#dev": {
  "dependsOn": ["^build"],
  "cache": false,
  "persistent": true
}
```

### CI (D9)

Root `pnpm run lint`, `format`, `typecheck`, `build` will include playground automatically once scripts exist. Paths-filter is deferred.

### Vercel

Wire Vercel project to `apps/playground` after merge. Not part of monorepo CI. Document deploy URL in app README.

### Schema artifact (`0.1.0.json`) (D10)

Not actively consumed externally. Keep hardcoded `0.1.0` filename and `ISOMER_SCHEMA_URI` for the move. Versioning/derivation from components package is a future follow-up if POEs start using it.

## Implementation checklist

### Phase 1 — Prepare tree

- [ ] Remove `isomer-next-playground/.git`.
- [ ] Move directory to `apps/playground/`.
- [ ] Delete `opengovsg-isomer-components-0.0.13.tgz`, `package-lock.json`, `node_modules/`, `dist/`.
- [ ] Delete `.eslintrc.cjs` once oxlint is wired.

### Phase 2 — Wire workspace

- [ ] Rename package to `playground`.
- [ ] Rewrite `package.json`: pnpm, `workspace:*` components dep, catalog deps (including TipTap v3), scripts above.
- [ ] Migrate TipTap v2 → v3 (extensions, imports, any API breaks).
- [ ] Add `tsconfig.json` extending monorepo base.
- [ ] Add oxlint/oxfmt config (copy pattern from `apps/studio` or minimal package).
- [ ] Add `turbo.json` override for `playground#dev`.
- [ ] Update root `package.json` `dev` script to `--filter=isomer-studio`.
- [ ] Run `pnpm install` from root; fix sherif/workspace violations.

### Phase 3 — Verify locally

- [ ] `pnpm --filter @opengovsg/isomer-components build`
- [ ] `pnpm --filter playground build` — confirm `public/0.1.0.json` regenerates.
- [ ] `pnpm --filter playground dev` — editor loads, preview renders, JSON validation works.
- [ ] `pnpm --filter playground lint && format && typecheck`
- [ ] Confirm `pnpm dev` at root starts **only** studio.

### Phase 4 — Monorepo hygiene

- [ ] Root `pnpm run build && lint && format && typecheck` green.
- [ ] Add README at `apps/playground/README.md` (purpose, `pnpm --filter playground dev`, schema generation, Vercel).
- [ ] Update root `CLAUDE.md` / `README.md` to list `playground` alongside `studio`.

### Phase 5 — Deploy (post-merge)

- [ ] Wire Vercel to `apps/playground`.
- [ ] External repo cleanup (manual, out of scope for this PR).

## Verification (definition of done)

1. `apps/playground/` exists; no copy at monorepo root.
2. No nested `.git`, no `.tgz`, no `package-lock.json`.
3. `@opengovsg/isomer-components` resolved via `workspace:*`.
4. `pnpm --filter playground dev` serves a working editor + preview.
5. `pnpm dev` at root does **not** start playground.
6. `pnpm run build && lint && format && typecheck` at root includes playground without new failures.
7. TipTap v3 migration complete (no v2 deps remaining).

## Out of scope

- External repo archive / README redirect (`isomerpages/isomer-next-playground`) — owner handles manually.
- CI paths-filter for playground.
- Replacing MUI JSONForms with monorepo UI primitives.
- Merging playground functionality into Studio or Storybook.
- Renaming or versioning `0.1.0.json` for external consumers.
- E2E tests for the playground.

## Risk notes

| Risk                                      | Mitigation                                                          |
| ----------------------------------------- | ------------------------------------------------------------------- |
| Stale tgz masked breaking schema changes  | Workspace link surfaces breaks immediately in CI                    |
| TipTap v2 → v3 migration scope            | Budget time in move PR; test editor/preview paths that touch TipTap |
| Root `dev` accidentally starts playground | Explicit `--filter=isomer-studio` on root dev script                |
| Nested git accidentally committed         | Delete `.git` before move                                           |
