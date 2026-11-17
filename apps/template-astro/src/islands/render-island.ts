// Server half of the islands runtime: renders a "use client" component as an island marker that
// hydrate-islands.ts picks up in the browser. Only imported by modules vite-plugin.ts generates.
//
// Output for <NavbarClient items={[...]} /> looks like:
//
//   <isomer-island data-component="templates/.../NavbarClient.js#NavbarClient"
//                  data-island-id=":R1:" data-props='{"items":[...]}'>
//     …the component's server-rendered HTML…
//   </isomer-island>
//
// Props that are server-rendered React nodes (e.g. `children`) can't be JSON, so they are
// rendered once into <isomer-slot data-slot="…"> and serialized as { "$slot": "…" }. The browser
// reuses that HTML as-is (same idea as Astro's slots).
import type { ComponentType, ReactNode } from "react"
import {
  createContext,
  createElement,
  isValidElement,
  useContext,
  useId,
} from "react"
import { renderToString } from "react-dom/server"

export type IslandJson =
  | string
  | number
  | boolean
  | null
  | IslandJson[]
  | { [key: string]: IslandJson }

type Props = Record<string, unknown>

// True while rendering inside an island. A wrapped component nested in another island's tree
// renders plainly, because the outer island hydrates (and re-renders) that whole subtree itself.
const InsideIsland = createContext(false)

const isComponent = (value: unknown): value is ComponentType<Props> =>
  typeof value === "function" ||
  (typeof value === "object" &&
    value !== null &&
    "$$typeof" in value &&
    (value.$$typeof === Symbol.for("react.forward_ref") ||
      value.$$typeof === Symbol.for("react.memo")))

const isReactNode = (value: unknown) =>
  isValidElement(value) || (Array.isArray(value) && value.some(isValidElement))

const isPlainObject = (value: object): value is Props =>
  Object.getPrototypeOf(value) === Object.prototype

// Slot contents are ordinary server-rendered markup, so islands inside them are islands again.
const Slot = ({ slotId, children }: { slotId: string; children?: ReactNode }) =>
  createElement(
    "isomer-slot",
    { "data-slot": slotId },
    createElement(InsideIsland.Provider, { value: false }, children),
  )

/**
 * Splits props into what the browser gets (JSON, with { $slot } placeholders) and what the
 * server renders (the same props, with each React node wrapped in a <Slot>).
 */
const splitProps = (props: Props, islandId: string, islandKey: string) => {
  let slotCount = 0

  // Returns [browser JSON (undefined = omit), server value].
  const visit = (
    value: unknown,
    path: string,
  ): [IslandJson | undefined, unknown] => {
    if (value === undefined || value === null) return [value, value]
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    )
      return [value, value]
    if (isReactNode(value)) {
      const slotId = `${islandId}.${slotCount++}`
      return [
        { $slot: slotId },
        createElement(Slot, { slotId }, value as ReactNode),
      ]
    }
    if (value instanceof Date) return [value.toISOString(), value]
    if (Array.isArray(value)) {
      const pairs = value.map((item, i) => visit(item, `${path}[${i}]`))
      return [
        pairs.map(([json]) => json ?? null),
        pairs.map(([, live]) => live),
      ]
    }
    if (typeof value === "object" && isPlainObject(value)) {
      const json: Record<string, IslandJson> = {}
      const live: Props = {}
      for (const [key, item] of Object.entries(value)) {
        const [itemJson, itemLive] = visit(item, path ? `${path}.${key}` : key)
        if (itemJson !== undefined) json[key] = itemJson
        live[key] = itemLive
      }
      return [json, live]
    }
    throw new Error(
      `[isomer-islands] ${islandKey}: prop "${path}" is not serializable (${typeof value})`,
    )
  }

  const [jsonProps, serverProps] = visit(props, "")
  return { jsonProps, serverProps: serverProps as Props }
}

export const renderIsland = <T>(Component: T, islandKey: string): T => {
  if (!isComponent(Component)) return Component

  const Island = (props: Props) => {
    const nested = useContext(InsideIsland)
    const islandId = useId()
    if (nested) return createElement(Component, props)

    const { jsonProps, serverProps } = splitProps(props, islandId, islandKey)

    // Render as a separate root with its own identifierPrefix, exactly like the browser will
    // hydrate it, so useId values (react-aria depends on them) match between server and client.
    const html = renderToString(
      createElement(
        InsideIsland.Provider,
        { value: true },
        createElement(Component, serverProps),
      ),
      { identifierPrefix: islandId },
    )

    return createElement("isomer-island", {
      "data-component": islandKey,
      "data-island-id": islandId,
      "data-props": JSON.stringify(jsonProps),
      dangerouslySetInnerHTML: { __html: html },
    })
  }
  Island.displayName = `Island(${islandKey})`
  return Island as T
}
