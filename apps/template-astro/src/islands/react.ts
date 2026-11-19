// "react" for everything this site renders, on top of preact/compat on the server and in the
// browser (see astro.config.ts). Preact keeps the server's attributes as-is on hydration, so an
// island's first render in the browser must match the server HTML exactly, ids included. Two hooks
// change:
// - useId counts from the render's prefix (each island, each page-level render), in render order,
//   on both sides. Preact's own ids restart at P0-0 in every root, so they'd repeat across islands.
// - useSyncExternalStore returns the server snapshot while server-rendering and hydrating, as React
//   does and preact/compat doesn't. react-aria relies on it to prefix its ids the same way.
import type { ReactNode } from "react"
import * as React from "react"

// @ts-expect-error -- @types/react is `export =`, which TS can't re-export; the runtime module can.
export * from "react"

const IslandIds = React.createContext<{ prefix: string; next: number } | null>(
  null,
)

/** A render's tree (an island's, or a page-level one), with its ids counted from `prefix`. */
export const withIslandIds = (prefix: string, children: ReactNode) =>
  React.createElement(
    IslandIds.Provider,
    { value: { prefix, next: 0 } },
    children,
  )

let hydrating = false
/** Runs a (synchronous) Preact hydration, so useSyncExternalStore knows to use the server snapshot. */
export const whileHydrating = (render: () => void) => {
  hydrating = true
  try {
    render()
  } finally {
    hydrating = false
  }
}

export const useId = () => {
  const ids = React.useContext(IslandIds)
  const fallback = React.useId()
  const [id] = React.useState(() => ids && `${ids.prefix}-${ids.next++}`)
  return id ?? fallback
}

export const useSyncExternalStore: typeof React.useSyncExternalStore = (
  subscribe,
  getSnapshot,
  getServerSnapshot,
) => {
  const [hydrated, setHydrated] = React.useState(!hydrating)
  React.useEffect(() => setHydrated(true), [])
  const value = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )
  const serverRendering = typeof document === "undefined"
  return (serverRendering || !hydrated) && getServerSnapshot
    ? getServerSnapshot()
    : value
}

export default { ...React, useId, useSyncExternalStore }
