import { describe, expect, it } from "vitest"

import { getFileKey } from "../asset.service"

describe("asset.service", () => {
  describe("getFileKey", () => {
    it("should generate a file key with basic ASCII filename", () => {
      // Arrange
      const siteId = 123
      const fileName = "test-file.jpg"

      // Act
      const result = getFileKey({ siteId, fileName })

      // Assert
      expect(result).toMatch(/^123\/[0-9a-f-]{36}\/test-file\.jpg$/)
    })

    it("should handle unicode characters in filename", () => {
      // Arrange
      const siteId = 456
      const fileName = "测试文件.pdf"

      // Act
      const result = getFileKey({ siteId, fileName })

      // Assert
      expect(result).toMatch(/^456\/[0-9a-f-]{36}\/测试文件\.pdf$/)
    })

    it("should handle emoji in filename", () => {
      // Arrange
      const siteId = 789
      const fileName = "🎉celebration🎊.png"

      // Act
      const result = getFileKey({ siteId, fileName })

      // Assert
      expect(result).toMatch(/^789\/[0-9a-f-]{36}\/🎉celebration🎊\.png$/)
    })

    it("should handle mixed unicode and ASCII characters", () => {
      // Arrange
      const siteId = 101
      const fileName = "report-2024年度.docx"

      // Act
      const result = getFileKey({ siteId, fileName })

      // Assert
      expect(result).toMatch(/^101\/[0-9a-f-]{36}\/report-2024年度\.docx$/)
    })

    it("should handle cyrillic characters", () => {
      // Arrange
      const siteId = 202
      const fileName = "документ.txt"

      // Act
      const result = getFileKey({ siteId, fileName })

      // Assert
      expect(result).toMatch(/^202\/[0-9a-f-]{36}\/документ\.txt$/)
    })

    it("should handle arabic characters", () => {
      // Arrange
      const siteId = 303
      const fileName = "ملف.pdf"

      // Act
      const result = getFileKey({ siteId, fileName })

      // Assert
      expect(result).toMatch(/^303\/[0-9a-f-]{36}\/ملف\.pdf$/)
    })

    it("should handle all special characters that might need sanitization even when the characters are not consecutive", () => {
      // Arrange
      const siteId = 404
      const fileName = '<fi:l|e<>:"|?*.txt'

      // Act
      const result = getFileKey({ siteId, fileName })

      // Assert
      // NOTE: Special characters in consecutive runs are compressed to single character
      expect(result).toMatch(/^404\/[0-9a-f-]{36}\/-fi-l-e-\.txt$/)
    })

    it("should handle special characters that might need sanitization", () => {
      // Arrange
      const siteId = 404
      const fileName = 'file<>:"|?*.txt'

      // Act
      const result = getFileKey({ siteId, fileName })

      // Assert
      // NOTE: Special characters in consecutive runs are compressed to single character
      expect(result).toMatch(/^404\/[0-9a-f-]{36}\/file-\.txt$/)
    })

    it("should handle very long unicode filename", () => {
      // Arrange
      const siteId = 505
      const longUnicodeName = "很长的文件名".repeat(20) + ".jpg"

      // Act
      const result = getFileKey({ siteId, fileName: longUnicodeName })

      // Assert
      expect(result).toMatch(/^505\/[0-9a-f-]{36}\/很长的文件名/)
      expect(result).toContain(".jpg")
    })

    it("should generate unique folder names for same filename", () => {
      // Arrange
      const siteId = 606
      const fileName = "同一个文件.pdf"

      // Act
      const result1 = getFileKey({ siteId, fileName })
      const result2 = getFileKey({ siteId, fileName })

      // Assert
      expect(result1).not.toEqual(result2)
      expect(result1).toMatch(/同一个文件\.pdf$/)
      expect(result2).toMatch(/同一个文件\.pdf$/)
    })

    it("should handle mixed scripts in filename", () => {
      // Arrange
      const siteId = 909
      const fileName = "English中文العربية.txt"

      // Act
      const result = getFileKey({ siteId, fileName })

      // Assert
      expect(result).toMatch(/^909\/[0-9a-f-]{36}\/English中文العربية\.txt$/)
    })
  })
})
