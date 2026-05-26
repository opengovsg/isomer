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

  it("strips only the trailing meta suffix when earlier brackets exist", () => {
    // Arrange + Act
    const stripped = stripFileUploadMetaSuffix(
      "Report [section 2] [PDF, 1.00 MB]",
    )

    // Assert
    expect(stripped).toBe("Report [section 2]")
  })

  it("returns empty string when text is only the suffix", () => {
    // Arrange + Act
    const stripped = stripFileUploadMetaSuffix(" [PDF, 280.00 KB]")

    // Assert
    expect(stripped).toBe("")
  })

  it("removes GB and TB sizes", () => {
    // Arrange + Act + Assert
    expect(stripFileUploadMetaSuffix("File [PDF, 1.00 GB]")).toBe("File")
    expect(stripFileUploadMetaSuffix("File [PDF, 1.00 TB]")).toBe("File")
  })

  it("does not strip when bracket lacks leading space", () => {
    // Arrange + Act
    const stripped = stripFileUploadMetaSuffix("Download[PDF, 1.00 KB]")

    // Assert
    expect(stripped).toBe("Download[PDF, 1.00 KB]")
  })

  it("does not strip invalid bracket content", () => {
    // Arrange + Act
    const stripped = stripFileUploadMetaSuffix("Download [not a suffix]")

    // Assert
    expect(stripped).toBe("Download [not a suffix]")
  })

  it("does not strip when trailing bracket is not at end of text", () => {
    // Arrange + Act
    const stripped = stripFileUploadMetaSuffix(
      "Download [PDF, 280.00 KB] extra",
    )

    // Assert
    expect(stripped).toBe("Download [PDF, 280.00 KB] extra")
  })
})
