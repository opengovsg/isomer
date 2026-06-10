# Studio components (`apps/studio/src/components`)

Components in this folder are **app-wide UI used by more than one feature**. If a component is used by exactly one feature, it belongs under `features/<area>/components/` instead — see `apps/studio/src/features/CLAUDE.md`.

This folder is _not_ the design system. Reusable, framework-agnostic primitives belong in `packages/components/` — see `packages/components/CLAUDE.md`.

## What goes where

| Location                                      | What                                                                               |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| `apps/studio/src/components/`                 | Studio-app UI shared across features (sidebar, navbar, error boundary, providers). |
| `apps/studio/src/features/<area>/components/` | UI used by exactly one feature.                                                    |
| `packages/components/src/`                    | UI rendered on the **published Isomer sites** — see that folder's CLAUDE.md.       |

If you are not sure: start in the feature folder. Lift up only when a second feature needs it.

## Styling

- Chakra UI is the component framework. Use Chakra primitives (`Box`, `Stack`, `Button`, etc.) and the OGP theme exported from `~/theme`.
- Tailwind is available for utility classes — prefer Chakra for layout and tokens, Tailwind for one-off utility styling.
- Hardcoded hex colours / pixel values are an anti-pattern. Use theme tokens.

## Component conventions

- One component per file. File name matches the export (`Foo.tsx` exports `Foo`).
- Folder-per-component when a component has sub-files (`Foo/index.tsx` + `Foo/FooHeader.tsx` + `Foo/types.ts`).
- Props interface lives next to the component as `interface FooProps` — exported only if consumed externally.
- Avoid default exports for components; named exports compose better with codemods and tooling.

## Server/client boundaries

- These are React 18 client components by default (Next.js Pages Router).
- Don't fetch data in `components/`. Components receive data via props or via shared hooks. Data fetching lives in feature components or pages.
- Side effects (analytics, intercom, etc.) belong in a provider under `AppProviders/` or in `instrumentation.ts`.

## A11y baseline

- Every interactive element must be keyboard reachable and have an accessible name.
- Use Chakra's `aria-*` props rather than rolling your own.
- Modals: use Chakra `Modal` (focus trap + escape handler built in). Don't reimplement.
- Images: pass meaningful `alt` text. Decorative images: `alt=""`.

## Testing

- Tests co-located with the component (`Foo.test.tsx` next to `Foo.tsx`).
- Test behaviour, not snapshots. No snapshot-only tests.

## Storybook

- Shared components used in more than two places should have a story.
- Story file: `Foo.stories.tsx` next to the component, or under `apps/studio/src/stories/` if the component takes a lot of mock setup.

## Anti-patterns the agent should refuse

- Hardcoded colours / spacings instead of theme tokens.
- Default-exported components.
- Direct `fetch` or tRPC calls from inside a shared component (push data through props).
- Reimplementing Chakra primitives instead of using them.
- Placing single-feature UI in this folder.
