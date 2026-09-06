import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"

import {
  resetPosthogModuleLoaderForTests,
  setPosthogModuleLoaderForTests,
  withPosthog,
} from "../posthog"

const resetMock = vi.fn()
const identifyMock = vi.fn()

afterAll(() => {
  resetPosthogModuleLoaderForTests()
})

describe("withPosthog", () => {
  beforeEach(() => {
    resetMock.mockClear()
    identifyMock.mockClear()
  })

  it("runs queued operations strictly in call order, even while the underlying import is still pending", async () => {
    // Arrange
    const order: number[] = []
    let releaseImport: () => void = () => undefined
    const importGate = new Promise<void>((resolve) => {
      releaseImport = resolve
    })

    // @ts-expect-error test stub supplies only the PostHog methods exercised by withPosthog
    setPosthogModuleLoaderForTests(async () => {
      await importGate
      return { default: { reset: resetMock, identify: identifyMock } }
    })

    // Act
    const first = withPosthog(() => order.push(1))
    const second = withPosthog(() => order.push(2))
    const third = withPosthog(() => order.push(3))
    releaseImport()
    await Promise.all([first, second, third])

    // Assert
    expect(order).toEqual([1, 2, 3])
  })
})
