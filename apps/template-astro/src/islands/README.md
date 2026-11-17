# Islands runtime

Published pages are server-rendered React (`RenderEngine` from `@opengovsg/isomer-components`).
Only `"use client"` components ship JavaScript. Each one becomes an **island** that is hydrated
on its own in the browser. This is the same boundary Next uses, without Next's runtime.

```
build (Node)                                         browser
──────────────────────────────────────────────       ─────────────────────────────────────────
page imports NavbarClient ("use client")
  │ vite-plugin.ts swaps the import for
  │ renderIsland(NavbarClient)
  ▼
render-island.ts renders:
  <isomer-island data-component="…#NavbarClient"  ──► hydrate-islands.ts
                 data-island-id=":R1:"                  finds each <isomer-island>,
                 data-props='{…}'>                      lazy-loads its module (virtual:isomer-islands),
    …server HTML…                                       hydrates it on load / visible / idle
  </isomer-island>
```

| File                   | Runs                         | Job                                                                                                                                                                                 |
| ---------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vite-plugin.ts`       | build                        | Finds `"use client"` modules in isomer-components and wraps their server imports with `renderIsland()`. Also generates `virtual:isomer-islands`, one lazy loader per island module. |
| `render-island.ts`     | build (SSR)                  | Renders a component as `<isomer-island>`, with its props as JSON. Each island is rendered as its own React root so `useId` values match on hydration.                               |
| `hydrate-islands.ts`   | browser                      | Hydrates islands. `HYDRATE_WHEN` sets per-component timing. React (or preact/compat) is only fetched if the page has an island.                                                     |
| `static-behaviours.js` | browser, inlined in `<head>` | The few behaviours of components that are deliberately _not_ islands: image fallback, back-to-top, notification dismiss. Plain JS because it's inlined verbatim.                    |

## Rules for component authors

- **Only mark a component `"use client"` if it needs React state or effects in the browser.** Every one becomes an island, with its own JS chunk and hydration cost. For a click handler or two, emit a `data-isomer-*` attribute and handle it in `static-behaviours.js`, the way `BackToTopLink` and `Notification` do.
- **Props passed into a `"use client"` component must be plain data.** No functions and no React elements; the build fails with the prop name if not. Render children _inside_ the client component instead.
- **React context doesn't cross into an island.** An island only sees context it provides itself.
- **Don't style an island's root element with `first:` / `last:` / `only:` variants.** The root sits inside an `<isomer-island>` wrapper, so those always match. Put that spacing on the server-rendered parent instead (see `ImageGallery`).
