import type { PropsWithChildren } from "react"
import type { SiteWideAssetSource } from "~/schemas/asset"
import { createContext, useContext } from "react"

// Site settings pages have no resource in the route, so they declare which
// site-wide section their uploads belong to
const UploadLinkTargetContext = createContext<SiteWideAssetSource | undefined>(
  undefined,
)

interface UploadLinkTargetProviderProps extends PropsWithChildren {
  source: SiteWideAssetSource
}

export function UploadLinkTargetProvider({
  source,
  children,
}: UploadLinkTargetProviderProps) {
  return (
    <UploadLinkTargetContext.Provider value={source}>
      {children}
    </UploadLinkTargetContext.Provider>
  )
}

// No throw when unprovided: outside site settings, uploads take their target
// from the route instead
export const useOptionalSiteWideUploadSource = () =>
  useContext(UploadLinkTargetContext)
