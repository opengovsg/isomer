import {
  createOfflineGrowthBook,
  mockFeatureFlags,
} from "~/lib/growthbookOffline"

const mockGrowthBook = createOfflineGrowthBook()

// Store the shared map. Tests pass that same map to setForcedFeatures to restore this instance.
mockGrowthBook.setForcedFeatures(mockFeatureFlags)

export { mockGrowthBook }
