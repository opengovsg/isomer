import { describe, expect, it, vi } from "vitest"

const resetMock = vi.fn<(...args: unknown[]) => unknown>(())
const identifyMock = vi.fn<(...args: unknown[]) => unknown>(())

let releaseImport: () => void
const importGate = new Promise<void>((resolve) => {
  releaseImport = resolve
})

vi.mock(import('posthog-js'), async () => {
  // Simulate the dynamic import taking a while to resolve (e.g. the very
  // first time the posthog-js chunk is fetched), so we can assert that
  // calls made while it's still pending don't jump the queue.
  await importGate
  return { default: { reset: resetMock, identify: identifyMock } }
})

const { withPosthog } = await import("../posthog")

describe("withPosthog", () => {

  it("runs queued operations strictly in call order, even while the underlying import is still pending", async () => {
    // Arrange
    const order: number[] = []

    // Act
    const first = withPosthog(() => order.push(1))
    const second = withPosthog(() => order.push(2))
    const third = withPosthog(() => order.push(3))
    releaseImport()
    await Promise.all([first, second, third])

    // Assert
    expect(order).toStrictEqual([1, 2, 3])
  })
})
