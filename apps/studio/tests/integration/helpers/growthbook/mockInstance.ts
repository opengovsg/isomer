import { GrowthBook } from "@growthbook/growthbook"

import { env } from "~/env.mjs"
import { mockFeatureFlags } from "./mockFeatureFlags"

const mockGrowthBook = new GrowthBook({
  apiHost: "https://cdn.growthbook.io",
  clientKey: env.GROWTHBOOK_CLIENT_KEY,
  debug: false,
})

mockGrowthBook.setForcedFeatures(mockFeatureFlags)

export { mockGrowthBook }
