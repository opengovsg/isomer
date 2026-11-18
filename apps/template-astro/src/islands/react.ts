// "react" for everything this site renders: React on the server, preact/compat in the browser
// (see astro.config.ts). Preact keeps the server's attributes as-is on hydration, so an island's
// first render in the browser must match the server HTML exactly, ids included. Two hooks change:
// - useId counts from the island's id, in render order, on both sides. React's own ids depend on
//   React internals, and Preact's restart at P0-0 in every island.
// - useSyncExternalStore returns the server snapshot while hydrating, as React does. react-aria
//   relies on it to prefix its ids the same way on both sides.
import type { ReactNode } from "react"
import * as React from "react"

// @ts-expect-error -- @types/react is `export =`, which TS can't re-export; the runtime module can.
export * from "react"

const IslandIds = React.createContext<{ prefix: string; next: number } | null>(
  null,
)

/** An island's tree, with its ids counted from `prefix`. */
export const withIslandIds = (prefix: string, children: ReactNode) =>
  React.createElement(
    IslandIds.Provider,
    { value: { prefix, next: 0 } },
    children,
  )

/** Server-rendered slot content inside an island: not part of its ids. */
export const withoutIslandIds = (children: ReactNode) =>
  React.createElement(IslandIds.Provider, { value: null }, children)

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
  const [id] = React.useState(() => ids && `${ids.prefix}${ids.next++}`)
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
  return !hydrated && getServerSnapshot ? getServerSnapshot() : value
}

export default { ...React, useId, useSyncExternalStore }
