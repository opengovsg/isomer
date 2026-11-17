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

| File                          | Runs                        | Job                                                                                                                                                                                                                                                                    |
| ----------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vite-plugin.ts`              | build                       | Finds `"use client"` modules in isomer-components and wraps their server imports with `renderIsland()`. Also generates `virtual:isomer-islands`, one lazy loader per island module. Its `NO_HYDRATION` list holds client components that render as plain HTML instead. |
| `render-island.ts`            | build (SSR)                 | Renders a component as `<isomer-island>`, with its props as JSON. React-node props such as `children` become `<isomer-slot>` HTML. Each island is rendered as its own React root so `useId` values match on hydration.                                                 |
| `hydrate-islands.ts`          | browser                     | Hydrates islands. `HYDRATE_WHEN` sets per-component timing. React (or preact/compat) is only fetched if the page has an island.                                                                                                                                        |
| `static-behaviours.js`        | browser, inline in `<head>` | Plain-JS replacements for the `NO_HYDRATION` components that still need behaviour (image fallback, back-to-top).                                                                                                                                                       |
| `postcss-island-selectors.ts` | build (CSS)                 | Keeps `:first-child`, `:last-child` and `:only-child` working through the `<isomer-island>` wrapper.                                                                                                                                                                   |

## Rules for component authors

- Props passed into a `"use client"` component must be JSON-serializable, or be React nodes, which become slots. The build fails with the prop's path if not. This is the same rule RSC enforces.
- React context does not cross into an island. An island only sees context it provides itself.
- If you add interactivity to a component listed in `NO_HYDRATION`, remove it from the list. Otherwise the interactivity silently won't run on published sites.
