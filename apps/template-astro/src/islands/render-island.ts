// Server half of the islands runtime: renders a "use client" component as an island marker that
// hydrate-islands.ts picks up in the browser. Only imported by modules vite-plugin.ts generates.
//
// Output for <NavbarClient items={[...]} /> looks like:
//
//   <isomer-island data-component="templates/.../NavbarClient.js#NavbarClient"
//                  data-island-id=":R1:" data-props='{"items":[...]}'>
//     …the component's server-rendered HTML…
//   </isomer-island>
import type { ComponentType } from "react"
import {
  createContext,
  createElement,
  isValidElement,
  useContext,
  useId,
} from "react"
import { renderToString } from "react-dom/server"

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

/** JSON for data-props. Fails the build on props that can't cross into the browser. */
const serializeProps = (props: Props, islandKey: string) =>
  JSON.stringify(props, (key, value: unknown) => {
    if (typeof value === "function" || isValidElement(value))
      throw new Error(
        `[isomer-islands] ${islandKey}: prop "${key}" can't be sent to the browser. ` +
          `Pass plain data into "use client" components.`,
      )
    return value
  })

export const renderIsland = <T>(Component: T, islandKey: string): T => {
  if (!isComponent(Component)) return Component

  const Island = (props: Props) => {
    const nested = useContext(InsideIsland)
    const islandId = useId()
    if (nested) return createElement(Component, props)

    // Render as a separate root with its own identifierPrefix, exactly like the browser will
    // hydrate it, so useId values (react-aria depends on them) match between server and client.
    const html = renderToString(
      createElement(
        InsideIsland.Provider,
        { value: true },
        createElement(Component, props),
      ),
      { identifierPrefix: islandId },
    )

    return createElement("isomer-island", {
      "data-component": islandKey,
      "data-island-id": islandId,
      "data-props": serializeProps(props, islandKey),
      dangerouslySetInnerHTML: { __html: html },
    })
  }
  Island.displayName = `Island(${islandKey})`
  return Island as T
}
