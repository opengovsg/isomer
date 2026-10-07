import { env } from "~/env.mjs"
import { createOfflineGrowthBook } from "~/lib/growthbookOffline"

import { mockFeatureFlags } from "./mockFeatureFlags"

const mockGrowthBook = createOfflineGrowthBook(env.GROWTHBOOK_CLIENT_KEY)

// Point at the shared map (not a copy) so `setForcedFeatures(mockFeatureFlags)`
// in a test resets this singleton back to the baseline.
mockGrowthBook.setForcedFeatures(mockFeatureFlags)

export { mockGrowthBook }
