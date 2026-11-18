# Islands

On published sites, pages are static HTML and only **islands** ship JavaScript: the components
that need React state or effects in the browser. This folder declares them. Hydrating them is
the host's job (`apps/template-astro/src/islands/`).

| File         | What it is                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `island.ts`  | `island(name, Component, { hydrate })` (`hydrate` is required: `"load"`, `"visible"` or `"idle"`) wraps an interactive component so it always renders inside `<isomer-island data-component="…">`, in Studio, Storybook and published sites alike. Also defines the markup protocol a host uses to hydrate islands (tag, attribute and slot-marker constants, `IslandRendererContext`, `InsideIsland`). |
| `loaders.ts` | `islandLoaders`: island name → lazy `import()` of its module, so a host downloads only the islands on a page. `__tests__/loaders.test.ts` fails if it drifts from the `island()` calls.                                                                                                                                                                                                                 |

## Making a component an island

```tsx
import { island } from "~/islands/island"

const NavbarClientComponent = (props: NavbarClientProps) => {
  /* state, effects… */
}

export const NavbarClient = island("NavbarClient", NavbarClientComponent, {
  hydrate: "load", // or "visible" (below the fold) / "idle" (never urgent)
})
```

Then add it to `islandLoaders`. Only wrap components that server-rendered code renders. A client
component used only inside another island is hydrated as part of that island.

## Rules

- **Only make it an island if it needs React state or effects in the browser.** Every island has its own JS chunk and hydration cost.
- **Props must be serializable, or be React nodes.** React nodes (`children` and the like) are rendered once on the server and reused as static HTML. Functions fail the published-site build with the prop path. This is the same rule RSC enforces.
- **React context doesn't cross into an island.** An island only sees context it provides itself.
- **Read browser-only state after mount** (storage, user agent): e.g. `useSessionStorage(key, value, { initializeWithValue: false })`. Each island hydrates as its own React root, which doesn't repair a first render that differs from the server HTML.
- **Don't style an island's root element with `first:` / `last:` / `only:` variants.** The root sits inside `<isomer-island>`, so those always match. Set the spacing from the parent instead (see `ImageGallery`, and `BackToTopLink` in `Content`).
