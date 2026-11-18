# Islands

On published sites, pages are static HTML and only **islands** ship JavaScript: the components
that need React state or effects in the browser. This folder declares them. Hydrating them is
the host's job (`apps/template-astro/src/islands/`).

| File          | What it is                                                                                                                                                                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `island.tsx`  | `island(name, Component, { hydrate })` marks a component as an island. It always renders inside `<isomer-island>`, in Studio, Storybook and published sites alike. A hydrating host plugs in through `IslandHost` and renders each island's tree with `IslandContent`. |
| `registry.ts` | `islands`: every island's name → a lazy `import()` of its module. `island()` only accepts names listed here, and `__tests__/registry.test.ts` checks each module exports the island under that name.                                                                   |
| `protocol.ts` | The markup: `HydrateWhen`, the tags, and helpers that write (`islandAttributes`, `slotAttributes`) and read (`readIslandAttributes`, `isSlotMarker`) the attributes, so both ends share one definition.                                                                |

## Making a component an island

```tsx
import { island } from "~/islands/island"

const NavbarClientComponent = (props: NavbarClientProps) => {
  /* state, effects… */
}

export const NavbarClient = island("NavbarClient", NavbarClientComponent, {
  hydrate: "load", // "visible" (below the fold) or "idle" (never urgent)
})
```

Then add its name and module to `islands` in `registry.ts`. Until you do, the `island()` call
doesn't typecheck. Only wrap components that server-rendered code renders: a component used
only inside another island is hydrated as part of that island.

## Rules

- **Only make it an island if it needs React state or effects in the browser.** Every island has its own JS chunk and hydration cost.
- **Props must be plain JSON data** (`Date`s become ISO strings). Server-rendered content can only be passed as `children`: it's rendered once on the server and reused as static HTML. Anything else, such as functions or React elements in other props, fails the published-site build with the prop name.
- **React context doesn't cross into an island.** An island only sees context it provides itself.
- **Read browser-only state after mount** (storage, user agent), e.g. `useSessionStorage(key, value, { initializeWithValue: false })`. Each island hydrates as its own React root, which doesn't repair a first render that differs from the server HTML.
- **Don't style an island's root element with `first:` / `last:` / `only:` variants.** The root sits inside `<isomer-island>`, so those always match. Set the spacing from the parent instead (see `ImageGallery`, and `BackToTopLink` in `Content`).
