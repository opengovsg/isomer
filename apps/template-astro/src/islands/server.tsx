// Server half of this site's islands runtime. Wrap the rendered tree in <IslandServerProvider> and
// every island() from @opengovsg/isomer-components renders as:
//
//   <isomer-island data-component="NavbarClient" data-hydrate="load"
//                  data-island-id=":R1:" data-props='{"items":[...]}'>
//     …the component's server-rendered HTML…
//   </isomer-island>
//
// Props must be JSON. The one exception is `children` holding server-rendered React nodes: it is
// rendered once into <isomer-slot data-slot="…"> and serialized as { "$slot": "…" }, and the
// browser reuses that HTML as-is (same idea as Astro's default slot).
import type { IslandRenderArgs } from "@opengovsg/isomer-components/islands"
import type { PropsWithChildren, ReactNode } from "react"
import {
  InsideIsland,
  ISLAND_ATTRS,
  ISLAND_STYLE,
  ISLAND_TAG,
  IslandRendererContext,
  SLOT_KEY,
  SLOT_TAG,
} from "@opengovsg/isomer-components/islands"
import { createElement, isValidElement, useId } from "react"
import { renderToString } from "react-dom/server"

const isReactNode = (value: unknown) =>
  isValidElement(value) || (Array.isArray(value) && value.some(isValidElement))

const isPlainObject = (value: object) => {
  const proto: unknown = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

// Slot contents are ordinary server-rendered markup, so islands inside them are islands again.
const Slot = ({ slotId, children }: { slotId: string; children?: ReactNode }) =>
  createElement(
    SLOT_TAG,
    { [ISLAND_ATTRS.slot]: slotId, style: ISLAND_STYLE },
    createElement(InsideIsland.Provider, { value: false }, children),
  )

/** data-props JSON. Dates become ISO strings (toJSON); anything else that isn't JSON fails the build. */
const serializeProps = (props: Record<string, unknown>, name: string) =>
  JSON.stringify(props, (key, value: unknown) => {
    const isJson =
      value === null ||
      ["string", "number", "boolean", "undefined"].includes(typeof value) ||
      Array.isArray(value) ||
      (typeof value === "object" && isPlainObject(value))
    if (!isJson || isValidElement(value))
      throw new Error(
        `[isomer-islands] ${name}: prop "${key}" can't be sent to the browser. Pass plain data, ` +
          `or server-rendered content as children.`,
      )
    return value
  })

const ServerIsland = ({
  name,
  hydrate,
  props,
  renderContent,
}: IslandRenderArgs) => {
  const islandId = useId()
  const { children, ...rest } = props
  const slotted = isReactNode(children)

  // Rendered as a separate root with its own identifierPrefix, exactly like the browser hydrates
  // it, so useId values (react-aria depends on them) match between server and client.
  const html = renderToString(
    renderContent(
      slotted
        ? {
            ...rest,
            children: createElement(
              Slot,
              { slotId: islandId },
              children as ReactNode,
            ),
          }
        : props,
    ),
    { identifierPrefix: islandId },
  )

  return createElement(ISLAND_TAG, {
    [ISLAND_ATTRS.component]: name,
    [ISLAND_ATTRS.hydrate]: hydrate,
    [ISLAND_ATTRS.islandId]: islandId,
    [ISLAND_ATTRS.props]: serializeProps(
      slotted ? { ...rest, children: { [SLOT_KEY]: islandId } } : props,
      name,
    ),
    style: ISLAND_STYLE,
    dangerouslySetInnerHTML: { __html: html },
  })
}

const renderServerIsland = (args: IslandRenderArgs) =>
  createElement(ServerIsland, args)

export const IslandServerProvider = ({ children }: PropsWithChildren) =>
  createElement(
    IslandRendererContext.Provider,
    { value: renderServerIsland },
    children,
  )
