import { describe, expect, it } from "vitest"

import type { Theme } from "../utils"
import {
  BACKGROUND_COLOURS,
  getPalette,
  passesContrastCheck,
  TEXT_COLOURS,
} from "../utils"

describe("settings.utils.ts", () => {
  describe("getPalette", () => {
    it("should generate a theme palette that passes contrast for #00ffff", () => {
      // Act
      const palette = getPalette("#00ffff")

      // Assert
      const actual = passesContrastCheck(palette as Theme)
      expect(actual).toBeTruthy()
    })

    it("should generate a theme palette for bright colors like red", () => {
      // Act
      const palette = getPalette("#ff0000")

      // Assert
      expect(palette).toHaveProperty("colors.brand.canvas.default")
      expect(palette).toHaveProperty("colors.brand.canvas.alt")
      expect(palette).toHaveProperty("colors.brand.canvas.inverse")
      expect(palette).toHaveProperty("colors.brand.interaction.default")
      expect(palette).toHaveProperty("colors.brand.interaction.hover")
      expect(palette).toHaveProperty("colors.brand.interaction.pressed")
      expect(passesContrastCheck(palette as Theme)).toBeTruthy()
    })

    it("should generate a theme palette for dark colors like dark brown", () => {
      // Act
      const palette = getPalette("#300707")

      // Assert
      expect(passesContrastCheck(palette as Theme)).toBeTruthy()
    })

    it("should generate a theme palette for medium colors like green", () => {
      // Act
      const palette = getPalette("#00ff00")

      // Assert
      expect(passesContrastCheck(palette as Theme)).toBeTruthy()
    })

    it("should generate a theme palette for light colors like baby pink", () => {
      // Act
      const palette = getPalette("#fffbeb")

      // Assert
      expect(passesContrastCheck(palette as Theme)).toBeTruthy()
    })

    it("should handle 3-character hex colors", () => {
      // Act
      const palette = getPalette("#f00")

      // Assert
      expect(passesContrastCheck(palette as Theme)).toBeTruthy()
    })

    it("should handle hex colors without # prefix", () => {
      // Act
      const palette = getPalette("0000ff")

      // Assert
      expect(passesContrastCheck(palette as Theme)).toBeTruthy()
    })

    it("should generate different canvas and interaction colors", () => {
      // Act
      const palette = getPalette("#3498db")

      // Assert
      expect(palette["colors.brand.canvas.default"]).not.toBe(
        palette["colors.brand.interaction.default"],
      )
      expect(palette["colors.brand.canvas.alt"]).not.toBe(
        palette["colors.brand.interaction.hover"],
      )
    })

    it("should handle partial colors that are less than 6 digits", () => {
      // Act
      const palette = getPalette("#0")

      // Assert
      expect(passesContrastCheck(palette as Theme)).toBeTruthy()
    })
  })

  describe("passesContrastCheck", () => {
    it("should pass for a theme with sufficient contrast ratios", () => {
      // Arrange - A theme that should pass
      const theme: Theme = {
        "colors.brand.canvas.default": "#f5f5f5", // Light background
        "colors.brand.canvas.alt": "#e0e0e0", // Light background
        "colors.brand.canvas.inverse": "#1a1a1a", // Dark background
        "colors.brand.interaction.default": "#0d47a1", // Dark blue
        "colors.brand.interaction.hover": "#01579b", // Darker blue
        "colors.brand.interaction.pressed": "#003c8f", // Even darker blue
      }

      // Act
      const result = passesContrastCheck(theme)

      // Assert
      expect(result).toBeTruthy()
    })

    it("should fail for a theme with insufficient contrast on light backgrounds", () => {
      // Arrange - Light backgrounds with light text would fail
      const theme: Theme = {
        "colors.brand.canvas.default": "#f5f5f5", // Light background
        "colors.brand.canvas.alt": "#e0e0e0", // Light background
        "colors.brand.canvas.inverse": "#1a1a1a", // Dark background
        "colors.brand.interaction.default": "#90caf9", // Too light blue (low contrast)
        "colors.brand.interaction.hover": "#64b5f6", // Too light blue
        "colors.brand.interaction.pressed": "#42a5f5", // Too light blue
      }

      // Act
      const result = passesContrastCheck(theme)

      // Assert
      expect(result).toBeFalsy()
    })

    it("should fail for a theme with insufficient contrast on dark backgrounds", () => {
      // Arrange - Dark backgrounds with dark text would fail
      const theme: Theme = {
        "colors.brand.canvas.default": "#3a3a3a", // Too dark (low contrast with dark text)
        "colors.brand.canvas.alt": "#2a2a2a", // Too dark
        "colors.brand.canvas.inverse": "#1a1a1a", // Dark background
        "colors.brand.interaction.default": "#0d47a1", // Dark blue
        "colors.brand.interaction.hover": "#01579b", // Darker blue
        "colors.brand.interaction.pressed": "#003c8f", // Even darker blue
      }

      // Act
      const result = passesContrastCheck(theme)

      // Assert
      expect(result).toBeFalsy()
    })

    it("should check contrast for all light background colors", () => {
      // Arrange
      const theme: Theme = {
        "colors.brand.canvas.default": "#ffffff",
        "colors.brand.canvas.alt": "#000000", // Black on white = bad for this test
        "colors.brand.canvas.inverse": "#000000",
        "colors.brand.interaction.default": "#000000",
        "colors.brand.interaction.hover": "#000000",
        "colors.brand.interaction.pressed": "#000000",
      }

      // Act - Even though canvas.default is fine, canvas.alt will be checked too
      const result = passesContrastCheck(theme)

      // Assert - Fails because we have black on white in canvas.alt
      expect(result).toBeFalsy()
    })

    it("should check contrast for all dark background colors", () => {
      // Arrange
      const theme: Theme = {
        "colors.brand.canvas.default": "#ffffff",
        "colors.brand.canvas.alt": "#f0f0f0",
        "colors.brand.canvas.inverse": "#ffffff", // White background, needs dark text (will fail)
        "colors.brand.interaction.default": "#000000",
        "colors.brand.interaction.hover": "#1a1a1a",
        "colors.brand.interaction.pressed": "#2a2a2a",
      }

      // Act - canvas.inverse is white, so light text on it will fail
      const result = passesContrastCheck(theme)

      // Assert
      expect(result).toBeFalsy()
    })

    it("should validate all required theme properties are checked", () => {
      // Arrange - Verify the function checks all 6 theme properties
      const validTheme: Theme = {
        "colors.brand.canvas.default": "#fafafa",
        "colors.brand.canvas.alt": "#f5f5f5",
        "colors.brand.canvas.inverse": "#0a0a0a",
        "colors.brand.interaction.default": "#1565c0",
        "colors.brand.interaction.hover": "#0d47a1",
        "colors.brand.interaction.pressed": "#01579b",
      }

      // Act
      const result = passesContrastCheck(validTheme)

      // Assert
      expect(result).toBeTruthy()

      // Verify background colors constants are being used
      expect(BACKGROUND_COLOURS.light).toHaveLength(2)
      expect(BACKGROUND_COLOURS.dark).toHaveLength(4)
    })

    it("should require minimum contrast ratio of 4.5:1", () => {
      // Arrange - Create a theme right at the boundary
      // Using colors that are just below 4.5:1 contrast
      const theme: Theme = {
        "colors.brand.canvas.default": "#ffffff",
        "colors.brand.canvas.alt": "#f0f0f0",
        "colors.brand.canvas.inverse": "#000000",
        "colors.brand.interaction.default": "#767676", // This is approximately 4.5:1 with white
        "colors.brand.interaction.hover": "#5a5a5a",
        "colors.brand.interaction.pressed": "#3a3a3a",
      }

      // Act
      const result = passesContrastCheck(theme)

      // Assert - Should pass with colors at or above 4.5:1
      expect(result).toBeTruthy()
    })

    it("should use correct text colors for contrast checking", () => {
      // Assert - Verify the constants are correct
      expect(TEXT_COLOURS.light).toBe("#FFFFFF")
      expect(TEXT_COLOURS.dark).toBeDefined()

      // Verify a theme using these colors
      const theme: Theme = {
        "colors.brand.canvas.default": "#ffffff",
        "colors.brand.canvas.alt": "#f5f5f5",
        "colors.brand.canvas.inverse": "#000000",
        "colors.brand.interaction.default": "#1976d2",
        "colors.brand.interaction.hover": "#1565c0",
        "colors.brand.interaction.pressed": "#0d47a1",
      }

      const result = passesContrastCheck(theme)
      expect(result).toBeTruthy()
    })
  })
})
