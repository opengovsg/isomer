import type { PropsWithChildren } from "react"
import { createContext, useContext, useState } from "react"

import type { ViewportOptions } from "./IframeToolbar"

const ViewportContext = createContext<{
  viewport: ViewportOptions
  setViewport: (viewport: ViewportOptions) => void
} | null>(null)

export function ViewportProvider({ children }: PropsWithChildren) {
  const [viewport, setViewport] = useState<ViewportOptions>("responsive")

  return (
    <ViewportContext.Provider value={{ viewport, setViewport }}>
      {children}
    </ViewportContext.Provider>
  )
}

export function useViewport() {
  const value = useContext(ViewportContext)
  if (!value) {
    throw new Error("useViewport must be used within a ViewportProvider")
  }
  return value
}
