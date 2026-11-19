# Islands runtime

How this site hydrates the islands that `@opengovsg/isomer-components` declares with `island()`
(see `packages/components/src/islands/README.md` for what an island is and how to make one).

```
build (Node)                                          browser
───────────────────────────────────────────────       ──────────────────────────────────────────
renderToString(<IslandServerProvider>…)
  every island() renders through server.tsx:
  <isomer-island data-component="NavbarClient"   ──►  client.ts: hydrateIslands()
                 data-hydrate="load"                    finds each <isomer-island>,
                 data-island-id=":R1:"                  lazy-loads its module (islands registry),
                 data-props='{…}'>                      hydrates it on load / visible / idle
    …server HTML…
  </isomer-island>
```

| File                 | Runs                 | Job                                                                                                                                                                                                                                                                                     |
| -------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server.tsx`         | build (SSR)          | `IslandServerProvider` plugs into `IslandHost`. Each island's props are written as JSON; server-rendered `children` become an `<isomer-slot>`. Each island is rendered as its own root, like the browser hydrates it.                                                                   |
| `client.ts`          | browser              | `hydrateIslands()` hydrates each island at the timing in `data-hydrate`, reusing the slot's HTML as-is. React (preact/compat) is only fetched if the page has an island. Development builds also compare each island's first client render with the server HTML (`hydration-check.ts`). |
| `react.ts`           | both                 | What every `"react"` import resolves to (`astro.config.ts`): preact/compat, with `useId` counted per render (each island, slot and page-level render) so ids match on both sides.                                                                                                             |
| `hydration-check.ts` | browser (dev builds) | Renders each island again off-page and reports the first difference from the server HTML, which Preact would otherwise keep silently.                                                                                                                                                   |

The markup itself (tags, attribute names, slot marker) is defined once, in the components
package's `islands/protocol.ts`.
