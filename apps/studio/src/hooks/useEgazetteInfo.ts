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
export const useEgazetteInfo = () =>
  useFeatureValue<EgazetteInfo>(EGAZETTE_INFO_FEATURE_KEY, {
    siteId: "",
    gazettesCollectionId: "",
  })
