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

| File         | Runs        | Job                                                                                                                                                                                                                                                             |
| ------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server.tsx` | build (SSR) | `IslandServerProvider` plugs into `IslandHost`. Each island's props are written as JSON; server-rendered `children` become an `<isomer-slot>`. Each island is rendered as its own React root (with an `identifierPrefix`) so `useId` values match on hydration. |
| `client.ts`  | browser     | `hydrateIslands()` hydrates each island at the timing in `data-hydrate`, reusing the slot's HTML as-is. React (preact/compat in production) is only fetched if the page has an island.                                                                          |

The markup itself (tags, attribute names, slot marker) is defined once, in the components
package's `islands/protocol.ts`.
