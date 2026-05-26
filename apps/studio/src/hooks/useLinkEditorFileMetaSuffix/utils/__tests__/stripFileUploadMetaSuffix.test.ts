import { describe, expect, it } from "vitest"

import { stripFileUploadMetaSuffix } from "../stripFileUploadMetaSuffix"

describe("stripFileUploadMetaSuffix", () => {
  it("removes trailing [type, size] before re-upload", () => {
    // Arrange + Act
    const stripped = stripFileUploadMetaSuffix(
      "Download speech [PDF, 280.00 KB]",
    )

    // Assert
    expect(stripped).toBe("Download speech")
  })

  it("removes XLSX before shorter XLS would incorrectly match", () => {
    // Arrange + Act
    const stripped = stripFileUploadMetaSuffix("File [XLSX, 1.00 MB]")

    // Assert
    expect(stripped).toBe("File")
  })

  it("removes trailing [type] when size is unavailable", () => {
    // Arrange + Act
    const stripped = stripFileUploadMetaSuffix("Download speech [PDF]")

    // Assert
    expect(stripped).toBe("Download speech")
  })

  it("removes trailing [size] when type is unknown", () => {
    // Arrange + Act
    const stripped = stripFileUploadMetaSuffix("Download data [100.00 B]")

    // Assert
    expect(stripped).toBe("Download data")
  })

  it("does not strip unrelated trailing brackets", () => {
    // Arrange + Act
    const stripped = stripFileUploadMetaSuffix("See policy [section 2a]")

    // Assert
    expect(stripped).toBe("See policy [section 2a]")
  })
})
