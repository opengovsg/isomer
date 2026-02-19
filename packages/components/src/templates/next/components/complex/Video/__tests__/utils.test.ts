import { describe, expect, it } from "vitest"

import { getVimeoVideoId, getYouTubeVideoId } from "../utils"

describe("utils", () => {
  describe("getYouTubeVideoId", () => {
    it("should extract video ID from YouTube watch URLs", () => {
      const testCases = [
        {
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          expected: "dQw4w9WgXcQ",
        },
        {
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be",
          expected: "dQw4w9WgXcQ",
        },
      ]

      testCases.forEach((testCase) => {
        expect(getYouTubeVideoId(testCase.url)).toBe(testCase.expected)
      })
    })

    it("should extract video ID from YouTube embed URLs", () => {
      const testCases = [
        {
          url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
          expected: "dQw4w9WgXcQ",
        },
        {
          url: "https://www.youtube.com/embed/dQw4w9WgXcQ?si=7dAKYmJw2jTNNqkr",
          expected: "dQw4w9WgXcQ",
        },
        {
          url: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
          expected: "dQw4w9WgXcQ",
        },
      ]

      testCases.forEach((testCase) => {
        expect(getYouTubeVideoId(testCase.url)).toBe(testCase.expected)
      })
    })

    it("should return null for non-YouTube URLs", () => {
      const testCases = [
        "https://player.vimeo.com/video/984159615",
        "https://www.facebook.com/plugins/video.php?href=...",
        "https://www.example.com/embed/abc",
      ]

      testCases.forEach((testCase) => {
        expect(getYouTubeVideoId(testCase)).toBeNull()
      })
    })

    it("should return null for invalid URLs", () => {
      const testCases = ["", "not-a-url"]

      testCases.forEach((testCase) => {
        expect(getYouTubeVideoId(testCase)).toBeNull()
      })
    })
  })

  describe("getVimeoVideoId", () => {
    it("should extract video ID from Vimeo embed URLs", () => {
      const testCases = [
        {
          url: "https://player.vimeo.com/video/984159615",
          expected: "984159615",
        },
        {
          url: "https://player.vimeo.com/video/357274789?dnt=true",
          expected: "357274789",
        },
        {
          url: "https://player.vimeo.com/video/123456789?h=abc123&dnt=true",
          expected: "123456789",
        },
      ]

      testCases.forEach((testCase) => {
        expect(getVimeoVideoId(testCase.url)).toBe(testCase.expected)
      })
    })

    it("should return null for non-Vimeo URLs", () => {
      const testCases = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://www.youtube.com/embed/dQw4w9WgXcQ",
        "https://www.facebook.com/plugins/video.php?href=...",
        "https://www.example.com/video/123",
        "https://vimeo.com/984159615", // non-embed Vimeo URL
      ]

      testCases.forEach((testCase) => {
        expect(getVimeoVideoId(testCase)).toBeNull()
      })
    })

    it("should return null for invalid URLs", () => {
      const testCases = ["", "not-a-url"]

      testCases.forEach((testCase) => {
        expect(getVimeoVideoId(testCase)).toBeNull()
      })
    })

    it("should return null for Vimeo URLs without video path", () => {
      const testCases = [
        "https://player.vimeo.com/",
        "https://player.vimeo.com/showcase/123",
      ]

      testCases.forEach((testCase) => {
        expect(getVimeoVideoId(testCase)).toBeNull()
      })
    })
  })
})
