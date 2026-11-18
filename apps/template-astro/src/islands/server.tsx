// Server half of this site's islands runtime. Wrap the rendered tree in <IslandServerProvider> and
// each island() renders with everything the browser needs to hydrate it (see the markup in
// @opengovsg/isomer-components/islands protocol.ts).
//
// Props must be JSON. The one exception is `children` holding server-rendered content: it's
// rendered once into a slot and the browser reuses that HTML as-is (like Astro's default slot).
import type { HostIslandProps } from "@opengovsg/isomer-components/islands"
import type { PropsWithChildren, ReactNode } from "react"
import {
  InsideIsland,
  IslandContent,
  IslandHost,
  islandAttributes,
  ISLAND_TAG,
  SLOT_TAG,
  SLOT_MARKER,
  slotAttributes,
} from "@opengovsg/isomer-components/islands"
import { createElement, isValidElement, useId } from "react"
import { renderToString } from "react-dom/server"

const isServerRendered = (value: unknown) =>
  isValidElement(value) || (Array.isArray(value) && value.some(isValidElement))

const isPlainObject = (value: object) => {
  const proto: unknown = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/** Props as JSON. Dates become ISO strings (toJSON); anything else that isn't JSON fails the build. */
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

// Slot contents are ordinary server-rendered markup, so islands inside them are islands again.
const Slot = ({ children }: { children?: ReactNode }) =>
  createElement(
    SLOT_TAG,
    slotAttributes,
    <InsideIsland.Provider value={false}>{children}</InsideIsland.Provider>,
  )

const ServerIsland = ({ name, hydrate, Component, props }: HostIslandProps) => {
  const id = useId()
  const { children, ...rest } = props
  const hasSlot = isServerRendered(children)

  // Rendered as a separate root with its own identifierPrefix, exactly like the browser hydrates
  // it, so useId values (react-aria depends on them) match between server and client.
  const html = renderToString(
    <IslandContent
      Component={Component}
      props={
        hasSlot
          ? { ...rest, children: <Slot>{children as ReactNode}</Slot> }
          : props
      }
    />,
    { identifierPrefix: id },
  )

  return createElement(ISLAND_TAG, {
    ...islandAttributes({
      name,
      hydrate,
      id,
      props: serializeProps(
        hasSlot ? { ...rest, children: SLOT_MARKER } : props,
        name,
      ),
    }),
    dangerouslySetInnerHTML: { __html: html },
  })
}

const renderServerIsland = (island: HostIslandProps) => (
  <ServerIsland {...island} />
)

export const IslandServerProvider = ({ children }: PropsWithChildren) => (
  <IslandHost.Provider value={renderServerIsland}>
    {children}
  </IslandHost.Provider>
)
