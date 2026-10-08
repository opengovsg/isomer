import { env } from "~/env.mjs"
import {
  createOfflineGrowthBook,
  testGrowthBookFeatures,
} from "~/lib/growthbookOffline"

const mockGrowthBook = createOfflineGrowthBook(env.GROWTHBOOK_CLIENT_KEY)

// Point at the shared map (not the copy createOfflineGrowthBook makes) so
// `setForcedFeatures(testGrowthBookFeatures)` resets this singleton.
mockGrowthBook.setForcedFeatures(testGrowthBookFeatures)

export { mockGrowthBook }
