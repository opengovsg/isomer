import { beforeEach, describe, expect, it, vi } from "vitest"
import { generateAltText } from "~/lib/generateAltText"

import type { Logger } from "@isomer/logging"

import {
  generateAltTextForUploadedImage,
  parseUploadedImageKey,
} from "../ai.service"

vi.mock("~/lib/generateAltText", async () => {
  const actual = await vi.importActual("~/lib/generateAltText")
  return {
    ...actual,
    generateAltText: vi.fn(),
  }
})

const ASSET_DOMAIN = "user-content.example.com"
const UUID = "11111111-1111-1111-1111-111111111111"
const PNG_KEY = `36/${UUID}/picture.png`

const logger = { error: vi.fn() } as unknown as Logger<string>

describe("ai.service", () => {
  describe("parseUploadedImageKey", () => {
    it("returns the key for a path on the asset domain", () => {
      // Arrange
      const src = `/${PNG_KEY}`

      // Act
      const result = parseUploadedImageKey(src)

      // Assert
      expect(result).toBe(PNG_KEY)
    })

    it("returns null when the path retargets the host", () => {
      // Arrange
      const src = "@169.254.169.254/latest/meta-data/"

      // Act
      const result = parseUploadedImageKey(src)

      // Assert
      expect(result).toBeNull()
    })

    it("returns null when the URL is on another host", () => {
      // Arrange
      const src = `https://evil.example.com/${PNG_KEY}`

      // Act
      const result = parseUploadedImageKey(src)

      // Assert
      expect(result).toBeNull()
    })

    it("returns null when the folder is not a uuid", () => {
      // Arrange
      const src = "/36/not-a-uuid/picture.png"

      // Act
      const result = parseUploadedImageKey(src)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe("generateAltTextForUploadedImage", () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
      fetchMock.mockReset()
      vi.stubGlobal("fetch", fetchMock)
      vi.mocked(generateAltText).mockReset()
      vi.mocked(logger.error).mockReset()
    })

    it("returns undefined for a file type the model does not describe", async () => {
      // Arrange
      const fileKey = `36/${UUID}/notes.pdf`

      // Act
      const result = await generateAltTextForUploadedImage({
        fileKey,
        logger,
      })

      // Assert
      expect(result).toBeUndefined()
      expect(fetchMock).not.toHaveBeenCalled()
      expect(generateAltText).not.toHaveBeenCalled()
    })

    it("describes a reachable image at its canonical asset URL", async () => {
      // Arrange
      fetchMock.mockResolvedValue({ ok: true, status: 200 })
      vi.mocked(generateAltText).mockResolvedValue("A red bus at a stop.")

      // Act
      const result = await generateAltTextForUploadedImage({
        fileKey: PNG_KEY,
        logger,
      })

      // Assert
      expect(result).toBe("A red bus at a stop.")
      expect(fetchMock).toHaveBeenCalledWith(
        `https://${ASSET_DOMAIN}/${PNG_KEY}`,
        { method: "HEAD" },
      )
      expect(generateAltText).toHaveBeenCalledWith(
        `https://${ASSET_DOMAIN}/${PNG_KEY}`,
      )
    })

    it("returns undefined when the image cannot be fetched", async () => {
      // Arrange
      fetchMock.mockResolvedValue({ ok: false, status: 404 })

      // Act
      const result = await generateAltTextForUploadedImage({
        fileKey: PNG_KEY,
        logger,
      })

      // Assert
      expect(result).toBeUndefined()
      expect(generateAltText).not.toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalled()
    })

    it("returns undefined when Pair Foundry fails", async () => {
      // Arrange
      fetchMock.mockResolvedValue({ ok: true, status: 200 })
      vi.mocked(generateAltText).mockRejectedValue(
        new Error("pair foundry down"),
      )

      // Act
      const result = await generateAltTextForUploadedImage({
        fileKey: PNG_KEY,
        logger,
      })

      // Assert
      expect(result).toBeUndefined()
      expect(logger.error).toHaveBeenCalled()
    })
  })
})
