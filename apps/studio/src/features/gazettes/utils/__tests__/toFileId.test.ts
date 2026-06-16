import { describe, expect, it } from "vitest"

import { toFileId } from "../toFileId"

const FILE_ID_REGEX = /^[_\-a-zA-Z0-9]+\.pdf$/

describe("toFileId", () => {
  it("passes through an already-valid file ID unchanged", () => {
    // Arrange / Act
    const result = toFileId("report_2026-01.pdf")

    // Assert
    expect(result).toBe("report_2026-01.pdf")
    expect(result).toMatch(FILE_ID_REGEX)
  })

  it("replaces whitespace with hyphens", () => {
    // Arrange / Act
    const result = toFileId("Gazette Notice 2026.pdf")

    // Assert
    expect(result).toBe("Gazette-Notice-2026.pdf")
    expect(result).toMatch(FILE_ID_REGEX)
  })

  it("strips disallowed punctuation such as parentheses", () => {
    // Arrange / Act
    const result = toFileId("Gazette (2026)!.pdf")

    // Assert
    expect(result).toBe("Gazette-2026.pdf")
    expect(result).toMatch(FILE_ID_REGEX)
  })

  it("produces a valid file ID from accented input", () => {
    // Arrange / Act / Assert
    expect(toFileId("café.pdf")).toMatch(FILE_ID_REGEX)
  })

  it("removes the .pdf extension case-insensitively and re-adds lowercase .pdf", () => {
    // Arrange / Act
    const result = toFileId("ANNUAL.PDF")

    // Assert
    expect(result).toBe("ANNUAL.pdf")
    expect(result).toMatch(FILE_ID_REGEX)
  })

  it("turns filesystem separators into hyphens rather than merging tokens", () => {
    // Arrange / Act
    const result = toFileId("2026/03/notice.pdf")

    // Assert
    expect(result).toBe("2026-03-notice.pdf")
    expect(result).toMatch(FILE_ID_REGEX)
  })

  it("falls back to 'file' when nothing valid remains", () => {
    // Arrange / Act / Assert
    expect(toFileId(".pdf")).toBe("file.pdf")
    expect(toFileId("")).toBe("file.pdf")
  })
})
