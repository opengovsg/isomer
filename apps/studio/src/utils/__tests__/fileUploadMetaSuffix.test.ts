import { describe, expect, it } from "vitest"

import {
  buildFileUploadMetaSuffix,
  getFileExtensionType,
  stripFileUploadMetaSuffix,
} from "../fileUploadMetaSuffix"

/** Minimal stand-in for browser `File` (implementation only uses `name` and `size`). */
const mockFile = (name: string, size: number): File => ({ name, size }) as File

describe("fileUploadMetaSuffix", () => {
  describe("getFileExtensionType", () => {
    it("maps allowed extensions to display suffix", () => {
      // Arrange + Act
      const pdf = getFileExtensionType("report.PDF")
      const xlsx = getFileExtensionType("data.xlsx")
      const xls = getFileExtensionType("old.xls")

      // Assert
      expect(pdf).toBe("PDF")
      expect(xlsx).toBe("XLSX")
      expect(xls).toBe("XLS")
    })

    it("returns undefined for unknown extensions", () => {
      // Arrange + Act
      const bin = getFileExtensionType("file.bin")

      // Assert
      expect(bin).toBeUndefined()
    })
  })

  describe("buildFileUploadMetaSuffix", () => {
    it("includes type and size for a PDF", () => {
      // Arrange + Act
      const suffix = buildFileUploadMetaSuffix(mockFile("speech.pdf", 286720))

      // Assert
      expect(suffix).toBe(" [PDF, 280.00 KB]")
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

    it("does not strip unrelated trailing brackets", () => {
      // Arrange + Act
      const stripped = stripFileUploadMetaSuffix("See policy [section 2a]")

      // Assert
      expect(stripped).toBe("See policy [section 2a]")
    })
  })
})
