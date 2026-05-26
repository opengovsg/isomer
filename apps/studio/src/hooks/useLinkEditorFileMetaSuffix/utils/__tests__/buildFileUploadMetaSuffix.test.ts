import { describe, expect, it } from "vitest"

import { buildFileUploadMetaSuffix } from "../buildFileUploadMetaSuffix"

/** Minimal stand-in for browser `File` (implementation only uses `name` and `size`). */
const mockFile = (name: string, size: number): File => ({ name, size }) as File

describe("buildFileUploadMetaSuffix", () => {
  it("includes type and size for allowed extensions", () => {
    // Arrange + Act + Assert
    expect(buildFileUploadMetaSuffix(mockFile("speech.pdf", 286720))).toBe(
      " [PDF, 280.00 KB]",
    )
    expect(buildFileUploadMetaSuffix(mockFile("data.xlsx", 1024))).toBe(
      " [XLSX, 1.00 KB]",
    )
    expect(buildFileUploadMetaSuffix(mockFile("old.xls", 1024))).toBe(
      " [XLS, 1.00 KB]",
    )
  })

  it("includes only size when extension is unknown", () => {
    // Arrange + Act
    const suffix = buildFileUploadMetaSuffix(mockFile("unknown.bin", 100))

    // Assert
    expect(suffix).toBe(" [100.00 B]")
  })
})
