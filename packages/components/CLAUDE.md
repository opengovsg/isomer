# `@opengovsg/isomer-components`

This package renders **published Isomer sites**. It is published to npm and consumed by Studio at build time. The boundary between Studio and this package is the most important contract in the repo — get it wrong and you ship a regression to every published site.

## What this package owns

- React templates and layouts for published sites (`src/templates/`).
- Block components for content (`src/templates/<variant>/components/`).
- The JSON Schema describing valid page content (`src/schemas/`).
- Interfaces and types consumed by Studio (`src/interfaces/`, `src/types/`).
- Pure utilities for rendering (`src/utils/`).
- The Storybook for visual documentation (`src/stories/`).

## The Components ↔ Studio contract

This is the rule the agent must never bend:

> **Studio drives content. `packages/components` renders content. Communication is by typed interfaces and the JSON Schema — nothing else.**

Concretely:

| Boundary            | What flows                                                                 |
| ------------------- | -------------------------------------------------------------------------- |
| Studio → Components | Content blocks validated against `schemas/`, layout props from interfaces. |
| Components → Studio | Exported types (`IsomerSchema`, etc.), constants, and the schema itself.   |

Things that violate the contract:

- A component that reads `window.location` or Studio-specific URLs.
- A component that calls back into Studio's API.
- A component that branches behaviour on a Studio-internal feature flag.
- Studio importing a private (un-exported) symbol from `packages/components/src/`.

If you need new data on the rendering side, add it to the **schema and interfaces first**, ship that PR, then update Studio to produce the new shape in a follow-up PR. The schema PR must remain backward-compatible (new fields are optional) so Studio doesn't break in between.

## No UI logic in JSONForms components

JSONForms components in this package render schema-driven editor UI inside Studio. They must stay **dumb renderers** of the schema:

- No branching on which Studio screen they're embedded in.
- No fetching data from the network.
- No state that lives outside the form value passed in.
- No imports from `apps/studio/src/`.

If a JSONForms component needs Studio-only behaviour, that behaviour belongs in Studio — wrap the component there.

## Layout

```
src/
├── templates/
│   ├── classic/        # Legacy template — frozen, no new features
│   └── next/           # Current template — new components land here
│       ├── components/
│       │   ├── complex/    # Composed multi-part blocks
│       │   ├── internal/   # Used by other components, not exported as blocks
│       │   └── native/     # Atomic blocks (Paragraph, Heading, Image, …)
│       ├── layouts/        # Page-shape templates (Article, Collection, Homepage, …)
│       ├── render/         # Block-to-component dispatch
│       ├── context/        # React context providers used by render
│       └── types/
├── schemas/            # JSON Schema describing valid content
├── interfaces/         # TS interfaces shared with consumers
├── engine/             # JSON Schema engine + AJV setup
├── presets/            # Pre-configured renderers
├── stories/            # Storybook
└── utils/              # Pure helpers (URL parsing, formatting)
```

## Adding a new block

1. Decide: `native` (atomic), `complex` (composed), or `internal` (helper).
2. Add the component under `src/templates/next/components/<bucket>/<Name>/`.
3. Add the schema entry under `src/schemas/` — must be backward compatible.
4. Add a Storybook story under `src/stories/` covering the new variants.
5. Export from `src/index.ts` (or the relevant sub-index) so Studio can consume it.
6. Bump the package version and update Studio in a follow-up PR.

## Conventions

### Pure rendering

- Components in templates are **server-renderable**: no `useState`, no `useEffect`, no browser-only APIs at the top level. Push interactivity into nested client components when unavoidable.
- No network calls. All data is passed in via props.

### Styling

- Tailwind classes drive styling. Tokens come from the Isomer theme (`tooling/template/styles/`).
- Hardcoded hex / px values are an anti-pattern.
- The classic template is **frozen** — bug fixes only, never new features.

### Types

- Components consume interfaces from `src/interfaces/`. Don't redeclare prop types inline if the prop matches a published interface.
- Export new public types from `src/index.ts`. Anything not exported is considered private and may break without notice.

### Schema changes

- Adding a field: must be optional (`?:`) for backward compatibility.
- Removing a field: minor or major version bump, requires Studio migration first.
- Changing the type of a field: never. Add a new field, deprecate the old, remove later.

## Storybook

- Every public component must have a story.
- Stories must cover empty, populated, long-content, and error states where applicable.
- The Storybook is published — treat it as documentation.

## Tests

- Visual + behavioural tests via Storybook.
- Unit tests (`.spec.ts`) for utilities and engine code.
- Snapshot tests are discouraged except for the JSON Schema itself.

## Anti-patterns the agent should refuse

- A template component importing from `apps/studio/src/`.
- A JSONForms component fetching data or holding non-form state.
- A breaking schema change without a Studio migration PR landing first.
- New work on the `classic` template.
- Adding a new block without a Storybook story.
