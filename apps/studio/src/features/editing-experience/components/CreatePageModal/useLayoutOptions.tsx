import { useFeatureValue } from "@growthbook/growthbook-react"
import omit from "lodash/omit"

import type { LayoutRenderDataType } from "./constants"
import { ENABLE_DATABASE_LAYOUT_FEATURE_KEY } from "~/lib/growthbook"
import { LAYOUT_RENDER_DATA } from "./constants"

interface UseLayoutOptionsProps {
  siteId: string
}

export const useLayoutOptions = ({ siteId }: UseLayoutOptionsProps) => {
  const { enabledSites } = useFeatureValue<{ enabledSites: string[] }>(
    ENABLE_DATABASE_LAYOUT_FEATURE_KEY,
    { enabledSites: [] },
  )

  const layoutOptions: Partial<LayoutRenderDataType> = enabledSites.includes(
    siteId,
  )
    ? LAYOUT_RENDER_DATA
    : omit(LAYOUT_RENDER_DATA, "database")

  return {
    layoutOptions,
  }
}
