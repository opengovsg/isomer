import { env } from "~/env.mjs"
import {
  createOfflineGrowthBook,
  mockFeatureFlags,
} from "~/lib/growthbookOffline"

const mockGrowthBook = createOfflineGrowthBook(env.GROWTHBOOK_CLIENT_KEY)

// Point at the shared map (not the copy createOfflineGrowthBook makes) so
// `setForcedFeatures(mockFeatureFlags)` resets this singleton.
mockGrowthBook.setForcedFeatures(mockFeatureFlags)

export { mockGrowthBook }
