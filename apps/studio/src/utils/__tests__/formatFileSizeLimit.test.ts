import { describe, expect, it } from "vitest"
import { ONE_MB_IN_BYTES } from "~/features/editing-experience/components/form-builder/renderers/controls/constants"

import { formatFileSizeLimit } from "../formatFileSizeLimit"

describe("formatFileSizeLimit", () => {
  it("uses KB when size is below 1 MB", () => {
    // Arrange
    const halfMbBytes = 500_000
    const oneByte = 1
    const onePointFiveKbBytes = 1500

    // Act
    const halfMbLabel = formatFileSizeLimit({ bytes: halfMbBytes })
    const oneByteLabel = formatFileSizeLimit({ bytes: oneByte })
    const onePointFiveKbLabel = formatFileSizeLimit({
      bytes: onePointFiveKbBytes,
    })

    // Assert
    expect(halfMbLabel).toBe("500 KB")
    expect(oneByteLabel).toBe("0 KB")
    expect(onePointFiveKbLabel).toBe("1.5 KB")
  })

  it("uses MB at exactly 1 MB", () => {
    // Arrange
    const bytes = ONE_MB_IN_BYTES

    // Act
    const result = formatFileSizeLimit({ bytes })

    // Assert
    expect(result).toBe("1 MB")
  })

  it("uses MB above 1 MB", () => {
    // Arrange
    const fiveMbBytes = 5 * ONE_MB_IN_BYTES
    const twoPointFiveMbBytes = 2_500_000

    // Act
    const fiveMbLabel = formatFileSizeLimit({ bytes: fiveMbBytes })
    const twoPointFiveMbLabel = formatFileSizeLimit({
      bytes: twoPointFiveMbBytes,
    })

    // Assert
    expect(fiveMbLabel).toBe("5 MB")
    expect(twoPointFiveMbLabel).toBe("2.5 MB")
  })

  it("rounds noisy floating-point MB values", () => {
    // Arrange
    const halfOfOneMbBytes = ONE_MB_IN_BYTES / 2
    const justOverThreeMbBytes = 3 * ONE_MB_IN_BYTES + 1

    // Act
    const halfMbLabel = formatFileSizeLimit({ bytes: halfOfOneMbBytes })
    const threeMbLabel = formatFileSizeLimit({ bytes: justOverThreeMbBytes })

    // Assert
    expect(halfMbLabel).toBe("500 KB")
    expect(threeMbLabel).toBe("3 MB")
  })
})
