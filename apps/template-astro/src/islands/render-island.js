// Server half of the islands runtime: renders a "use client" component as an island marker that
// hydrate-islands.js picks up in the browser. Only imported by modules vite-plugin.mjs generates.
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
import {
  createContext,
  createElement,
  isValidElement,
  useContext,
  useId,
} from "react"
import { renderToString } from "react-dom/server"

// True while rendering inside an island. A wrapped component nested in another island's tree
// renders plainly, because the outer island hydrates (and re-renders) that whole subtree itself.
const InsideIsland = createContext(false)

const isComponent = (value) =>
  typeof value === "function" ||
  value?.$$typeof === Symbol.for("react.forward_ref") ||
  value?.$$typeof === Symbol.for("react.memo")

const isReactNode = (value) =>
  isValidElement(value) || (Array.isArray(value) && value.some(isValidElement))

const isPlainObject = (value) =>
  Object.getPrototypeOf(value) === Object.prototype

// Slot contents are ordinary server-rendered markup, so islands inside them are islands again.
const Slot = ({ slotId, children }) =>
  createElement(
    "isomer-slot",
    { "data-slot": slotId },
    createElement(InsideIsland.Provider, { value: false }, children),
  )

/**
 * Splits props into what the browser gets (JSON, with { $slot } placeholders) and what the
 * server renders (the same props, with each React node wrapped in a <Slot>).
 */
const splitProps = (props, islandId, islandKey) => {
  let slotCount = 0

  const visit = (value, path) => {
    if (value === undefined || value === null) return [value, value]
    if (["string", "number", "boolean"].includes(typeof value))
      return [value, value]
    if (isReactNode(value)) {
      const slotId = `${islandId}.${slotCount++}`
      return [{ $slot: slotId }, createElement(Slot, { slotId }, value)]
    }
    if (value instanceof Date) return [value.toISOString(), value]
    if (Array.isArray(value)) {
      const pairs = value.map((item, i) => visit(item, `${path}[${i}]`))
      return [
        pairs.map(([json]) => json ?? null),
        pairs.map(([, live]) => live),
      ]
    }
    if (isPlainObject(value)) {
      const json = {}
      const live = {}
      for (const [key, item] of Object.entries(value)) {
        ;[json[key], live[key]] = visit(item, path ? `${path}.${key}` : key)
        if (json[key] === undefined) delete json[key]
      }
      return [json, live]
    }
    throw new Error(
      `[isomer-islands] ${islandKey}: prop "${path}" is not serializable (${typeof value})`,
    )
  }

  const [jsonProps, serverProps] = visit(props, "")
  return { jsonProps, serverProps }
}

export const renderIsland = (Component, islandKey) => {
  if (!isComponent(Component)) return Component

  const Island = (props) => {
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
  return Island
}
