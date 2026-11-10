"use client"

import type { ReactNode } from "react"
import { createContext } from "react"

// Off by default so published sites show the placeholder immediately; Studio's
// previews turn it on because freshly-saved assets are briefly unservable there.
export const ImageRetryContext = createContext(false)

export const ImageRetryProvider = ({ children }: { children: ReactNode }) => (
  <ImageRetryContext.Provider value={true}>
    {children}
  </ImageRetryContext.Provider>
)
