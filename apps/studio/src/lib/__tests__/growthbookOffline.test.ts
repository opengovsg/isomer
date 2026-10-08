import { GrowthBook } from "@growthbook/growthbook"
import { afterEach, describe, expect, it, vi } from "vitest"
import { env } from "~/env.mjs"
import {
  IS_AUDIT_LOG_ENABLED_FEATURE_KEY,
  IS_SINGPASS_ENABLED_FEATURE_KEY,
} from "~/lib/growthbook"
import { createOfflineGrowthBook } from "~/lib/growthbookOffline"
import { createGrowthBookContext } from "~/server/context"

describe("createOfflineGrowthBook", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("serves the test flags without calling the GrowthBook CDN", () => {
    // Arrange
    const init = vi.spyOn(GrowthBook.prototype, "init")
    const fetchSpy = vi.spyOn(globalThis, "fetch")

    // Act
    const gb = createOfflineGrowthBook()

    // Assert
    expect(init).toHaveBeenCalledTimes(0)
    expect(fetchSpy).toHaveBeenCalledTimes(0)
    expect(gb.ready).toBe(true)
    expect(gb.getFeatureValue(IS_SINGPASS_ENABLED_FEATURE_KEY, false)).toBe(
      true,
    )
    expect(gb.isOn(IS_AUDIT_LOG_ENABLED_FEATURE_KEY)).toBe(false)
  })
})

describe("createGrowthBookContext", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("does not fetch remote features when the app env is test", async () => {
    // Arrange
    expect(env.NEXT_PUBLIC_APP_ENV).toBe("test")
    const init = vi.spyOn(GrowthBook.prototype, "init")

    // Act
    const gb = await createGrowthBookContext()

    // Assert
    expect(init).toHaveBeenCalledTimes(0)
    expect(gb.ready).toBe(true)
    expect(gb.isOn(IS_SINGPASS_ENABLED_FEATURE_KEY)).toBe(true)
  })
})
