# Features (`apps/studio/src/features`)

Each top-level folder under `features/` is a vertical slice of one user-facing area: dashboard, editing-experience, gazettes, permissions, settings, sign-in, users, etc.

A feature owns its own UI, hooks, atoms, schemas, and tests. Server logic for the same domain lives separately under `server/modules/<area>/` — see `apps/studio/src/server/CLAUDE.md`.

## Layout

Typical feature shape:

```
features/<area>/
├── components/         # React components scoped to this feature
├── hooks/              # Custom hooks scoped to this feature
├── atoms.ts            # Jotai atoms for local UI state
├── schema.ts           # Feature-internal Zod schemas (if not shared)
├── constants.ts        # Feature-internal constants
├── data/               # Static data, fixtures, lookup tables (when present)
├── utils/              # Feature-internal helpers
└── __tests__/          # Vitest tests
```

Not every feature needs every folder. Add a folder when you have more than one file of that kind.

## Rules

### Feature isolation

- A feature **must not import from another feature's internals.** If two features need the same code, lift it into `apps/studio/src/components/`, `apps/studio/src/hooks/`, `apps/studio/src/lib/`, or `apps/studio/src/utils/` as appropriate.
- A feature **may** import from `~/components`, `~/hooks`, `~/lib`, `~/schemas`, `~/utils`, and `~/server` types — these are the shared surface.

### State

- Local UI state → `useState` or a feature-scoped Jotai atom in `atoms.ts`.
- Server state → tRPC + React Query. Do not duplicate server state into Jotai.
- Shared cross-feature state belongs in a top-level atoms file, not in a feature.

### Data fetching

- Use the tRPC client (`api.<router>.<procedure>.useQuery` / `useMutation`). Never call `fetch` against our own backend.
- Loading and error states are required for every query — surface them with the shared `Suspense` / `ErrorBoundary` wrappers in `~/components/`.

### Forms

- Validation schemas live in `~/schemas/` if shared with the server router, or in a feature-local `schema.ts` if not.
- Use the existing form-builder primitives in `editing-experience/components/form-builder/` for editor-style forms; use Chakra `FormControl` + `react-hook-form` for everything else.

### Tests

- Co-located in `__tests__/` per feature.
- Unit tests for pure functions and hooks. Component tests via `@testing-library/react`.
- For flows that span features (e.g. "create page → publish"), put the test under `apps/studio/tests/e2e/` instead.

## Adding a new feature — checklist

1. Create `features/<area>/` with `components/` as the minimum.
2. Wire the entry point from `pages/` (Next.js page) — keep the page file a thin shell that mounts the feature component.
3. If the feature talks to a new server domain, add the router under `server/modules/<area>/` in the same stack of PRs.
4. Tests: at least one happy-path component test.
5. If the feature requires a Linear `area:` label other than `area:studio`, document the mapping in `docs/ai-workflow.md`.

## Anti-patterns the agent should refuse

- Cross-feature imports (`features/foo` importing from `features/bar/...`).
- Pages doing real work instead of delegating to a feature component.
- Direct `fetch` calls to Studio's own API instead of tRPC.
- Mirroring tRPC query data into a Jotai atom.
- Adding shared UI primitives inside a feature folder.
