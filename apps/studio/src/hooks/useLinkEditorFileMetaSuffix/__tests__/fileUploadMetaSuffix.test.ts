import { describe, expect, it } from "vitest"

import {
  buildFileUploadMetaSuffix,
  stripFileUploadMetaSuffix,
} from "../fileUploadMetaSuffix"

/** Minimal stand-in for browser `File` (implementation only uses `name` and `size`). */
const mockFile = (name: string, size: number): File => ({ name, size }) as File

describe("fileUploadMetaSuffix", () => {
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
})
