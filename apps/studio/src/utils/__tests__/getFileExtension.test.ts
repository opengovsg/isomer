import { describe, expect, it } from "vitest"

import { getFileExtension } from "../getFileExtension"

describe("getFileExtension", () => {
  it("returns lowercased extension including the dot", () => {
    // Arrange
    const pdfName = "Document.PDF"
    const jpgName = "image.JPG"

    // Act
    const pdfExt = getFileExtension(pdfName)
    const jpgExt = getFileExtension(jpgName)

    // Assert
    expect(pdfExt).toBe(".pdf")
    expect(jpgExt).toBe(".jpg")
  })

  it("uses the last dot for compound names", () => {
    // Arrange
    const gzName = "archive.tar.gz"
    const txtName = "my.file.name.txt"

    // Act
    const gzExt = getFileExtension(gzName)
    const txtExt = getFileExtension(txtName)

    // Assert
    expect(gzExt).toBe(".gz")
    expect(txtExt).toBe(".txt")
  })

  it("returns empty string when there is no dot", () => {
    // Arrange
    const readme = "README"
    const empty = ""

    // Act
    const readmeExt = getFileExtension(readme)
    const emptyExt = getFileExtension(empty)

    // Assert
    expect(readmeExt).toBe("")
    expect(emptyExt).toBe("")
  })
})
