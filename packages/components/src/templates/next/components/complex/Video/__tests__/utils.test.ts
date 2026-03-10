import { describe, expect, it } from "vitest"

import {
  getPrivacyEnhancedYouTubeEmbedUrl,
  getVimeoVideoId,
  getYouTubeVideoId,
} from "../utils"

describe("utils", () => {
  describe("getPrivacyEnhancedYouTubeEmbedUrl", () => {
    it("rewrites www.youtube.com to www.youtube-nocookie.com for watch URLs", () => {
      const url = new URL("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
      expect(getPrivacyEnhancedYouTubeEmbedUrl(url)).toBe(
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      )
    })

    it("rewrites www.youtube.com to www.youtube-nocookie.com for embed URLs", () => {
      const url = new URL("https://www.youtube.com/embed/dQw4w9WgXcQ")
      expect(getPrivacyEnhancedYouTubeEmbedUrl(url)).toBe(
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      )
    })

    it("rewrites youtube.com (no www) to privacy-enhanced host", () => {
      const url = new URL("https://youtube.com/watch?v=abc123")
      expect(getPrivacyEnhancedYouTubeEmbedUrl(url)).toBe(
        "https://www.youtube-nocookie.com/embed/abc123",
      )
    })

    it("leaves www.youtube-nocookie.com unchanged for watch URLs", () => {
      const url = new URL("https://www.youtube-nocookie.com/watch?v=abc123")
      expect(getPrivacyEnhancedYouTubeEmbedUrl(url)).toBe(
        "https://www.youtube-nocookie.com/embed/abc123",
      )
    })

    it("leaves www.youtube-nocookie.com unchanged for embed URLs", () => {
      const url = new URL("https://www.youtube-nocookie.com/embed/abc123")
      expect(getPrivacyEnhancedYouTubeEmbedUrl(url)).toBe(
        "https://www.youtube-nocookie.com/embed/abc123",
      )
    })

    it("leaves youtube-nocookie.com (no www) unchanged", () => {
      const url = new URL("https://youtube-nocookie.com/embed/abc123")
      expect(getPrivacyEnhancedYouTubeEmbedUrl(url)).toBe(
        "https://youtube-nocookie.com/embed/abc123",
      )
    })

    it("returns empty string for watch URL without v parameter", () => {
      const url = new URL("https://www.youtube.com/watch")
      expect(getPrivacyEnhancedYouTubeEmbedUrl(url)).toBe("")
    })

    it("returns undefined for unsupported path", () => {
      const url = new URL("https://www.youtube.com/feed/subscriptions")
      expect(getPrivacyEnhancedYouTubeEmbedUrl(url)).toBeUndefined()
    })
  })

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

    it("should return null for YouTube video-series (playlist) embed URLs", () => {
      const testCases = [
        "https://www.youtube.com/embed/videoseries?list=PLH2CR4s1lqyhblReuK5ULf6cB100TO-VU",
        "https://www.youtube.com/embed/videoseries?si=FyxmgTc4hGelVqNi&list=PLH2CR4s1lqyhblReuK5ULf6cB100TO-VU",
        "https://www.youtube-nocookie.com/embed/videoseries?list=PLxxx",
      ]

      testCases.forEach((testCase) => {
        expect(getYouTubeVideoId(testCase)).toBeNull()
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
