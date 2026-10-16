"use client"

// Editor-only signal: when true, managed asset URLs are rendered with the
// delivery CDN's transcode bypass (?original=true) so a just-saved image
// resolves immediately. The CDN's optimized variant 404s for a few seconds
// after upload (not yet propagated), which the Studio preview would otherwise
// show as a broken/placeholder image until a manual refresh. Reading the raw
// stored object avoids that window. Defaults to false so the published site is
// unaffected and keeps serving optimized variants.
import { createContext, useContext } from "react"

const OriginalAssetContext = createContext<boolean>(false)

export const OriginalAssetProvider = ({
  children,
  value = false,
}: {
  children: React.ReactNode
  value?: boolean
}) => (
  <OriginalAssetContext.Provider value={value}>
    {children}
  </OriginalAssetContext.Provider>
)

export const useOriginalAsset = (): boolean => useContext(OriginalAssetContext)
