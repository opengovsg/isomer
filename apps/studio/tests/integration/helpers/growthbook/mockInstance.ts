import {
  createOfflineGrowthBook,
  mockFeatureFlags,
} from "~/lib/growthbookOffline"

const mockGrowthBook = createOfflineGrowthBook()

// Point at the shared map (not the copy createOfflineGrowthBook makes) so
// `setForcedFeatures(mockFeatureFlags)` resets this singleton.
mockGrowthBook.setForcedFeatures(mockFeatureFlags)

export { mockGrowthBook }
