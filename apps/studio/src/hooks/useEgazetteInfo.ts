import { useFeatureValue } from "@growthbook/growthbook-react"
import { EGAZETTE_INFO_FEATURE_KEY } from "~/lib/growthbook"

// NOTE: disabled as we need to satisfy `JSONValue` for the hook
// which `interface` does not due to lacking an index signature
// for `string`
// oxlint-disable-next-line typescript/consistent-type-definitions
type EgazetteInfo = {
  siteId: string
  gazettesCollectionId: string
}

interface ConfiguredEgazetteInfo {
  isConfigured: true
  siteId: string
  gazettesCollectionId: string
}

interface UnconfiguredEgazetteInfo {
  isConfigured: false
  siteId: ""
  gazettesCollectionId: ""
}

/**
 * Reads the egazette feature flag. When the flag is missing or empty,
 * `isConfigured` is `false` so callers can render an explicit
 * "feature not enabled" state instead of silently calling backend
 * procedures with `collectionId: 0` (which Zod rejects with an opaque
 * error) or pinning a Toppan user to a non-existent route.
 */
export const useEgazetteInfo = ():
  | ConfiguredEgazetteInfo
  | UnconfiguredEgazetteInfo => {
  const value = useFeatureValue<EgazetteInfo>(EGAZETTE_INFO_FEATURE_KEY, {
    siteId: "",
    gazettesCollectionId: "",
  })
  if (value.siteId && value.gazettesCollectionId) {
    return {
      isConfigured: true,
      siteId: value.siteId,
      gazettesCollectionId: value.gazettesCollectionId,
    }
  }
  return { isConfigured: false, siteId: "", gazettesCollectionId: "" }
}
