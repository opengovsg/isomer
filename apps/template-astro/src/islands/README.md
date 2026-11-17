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
                 data-island-id=":R1:"                  lazy-loads it via islandLoaders,
                 data-props='{…}'>                      hydrates it on load / visible / idle
    …server HTML…
  </isomer-island>
```

| File         | Runs        | Job                                                                                                                                                                                                                                                                                          |
| ------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server.tsx` | build (SSR) | `IslandServerProvider` plugs into `IslandRendererContext`. Each island is rendered with its props as JSON. React-node props such as `children` become `<isomer-slot>` HTML. Each island is rendered as its own React root (with an `identifierPrefix`) so `useId` values match on hydration. |
| `client.ts`  | browser     | `hydrateIslands()` hydrates each island at the timing in `data-hydrate`, reusing slot HTML as-is. React (or preact/compat) is only fetched if the page has an island.                                                                                                                        |

The tag, attribute and slot-marker names come from the components package, so both ends of the
protocol share one definition.
