import { describe, expect, it } from "vitest"

import { generateResourceUrl } from "../utils"

describe("generateResourceUrl", () => {
  it("produces a normal slug for a Latin title", () => {
    // Arrange
    const title = "Hello World"

    // Act
    const result = generateResourceUrl(title)

    // Assert
    expect(result).toBe("hello-world")
  })

  it("replaces each non-alphanum character with a hyphen", () => {
    // Arrange
    const title = "foo   bar  !!!  ???"

    // Act
    const result = generateResourceUrl(title)

    // Assert
    expect(result).toBe("foo---bar----------")
  })

  describe("Tamil", () => {
    it("transliterates a purely Tamil title", () => {
      // Arrange
      const title = "இது தமிழில் ஒரு தலைப்பு"

      // Act
      const result = generateResourceUrl(title)

      // Assert
      expect(result).toBe("itu-tmilllil-oru-tlaippu")
    })

    it("transliterates when mixed with Tamil characters", () => {
      // Arrange
      const title = "Tamil தமிழ்"

      // Act
      const result = generateResourceUrl(title)

      // Assert
      expect(result).toBe("tamil-tmilll")
    })
  })

  describe("Chinese", () => {
    it("transliterates Simplified Chinese using pinyin", () => {
      // Arrange
      const title = "中文标题"

      // Act
      const result = generateResourceUrl(title)

      // Assert
      expect(result).toBe("zhong-wen-biao-ti")
    })

    it("transliterates Traditional Chinese using pinyin", () => {
      // Arrange
      const title = "繁體中文"

      // Act
      const result = generateResourceUrl(title)

      // Assert
      expect(result).toBe("fan-ti-zhong-wen")
    })
  })

  describe("Japanese", () => {
    it("transliterates hiragana to romaji", () => {
      // Arrange
      const title = "こんにちは"

      // Act
      const result = generateResourceUrl(title)

      // Assert
      expect(result).toBe("konnitiha")
    })
  })

  describe("German", () => {
    it("converts umlauts to their ASCII equivalents", () => {
      // Arrange
      const title = "München"

      // Act
      const result = generateResourceUrl(title)

      // Assert
      expect(result).toBe("munchen")
    })

    it("converts ß and other special characters to ASCII", () => {
      // Arrange
      const title = "Über die Straße"

      // Act
      const result = generateResourceUrl(title)

      // Assert
      expect(result).toBe("uber-die-strasse")
    })
  })
})
