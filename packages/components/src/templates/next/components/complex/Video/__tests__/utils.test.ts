import { describe, expect, it } from "vitest"

import {
  getHqYouTubeThumbnailUrl,
  getPrivacyEnhancedVimeoEmbedUrl,
  getPrivacyEnhancedYouTubeEmbedUrl,
  getPreferredYouTubeThumbnailUrl,
  getVimeoVideoId,
  getYouTubeVideoId,
  shouldFallbackToHqYouTubeThumbnail,
} from "../utils"

describe("utils", () => {
  describe("getPrivacyEnhancedVimeoEmbedUrl", () => {
    it("adds dnt=true when URL has no existing query params", () => {
      expect(
        getPrivacyEnhancedVimeoEmbedUrl(
          "https://player.vimeo.com/video/984159615",
        ),
      ).toBe("https://player.vimeo.com/video/984159615?dnt=true")
    })

    it("preserves existing query params while forcing dnt=true", () => {
      expect(
        getPrivacyEnhancedVimeoEmbedUrl(
          "https://player.vimeo.com/video/984159615?h=945031e683",
        ),
      ).toBe("https://player.vimeo.com/video/984159615?h=945031e683&dnt=true")
    })

    it("overrides existing dnt value to true", () => {
      expect(
        getPrivacyEnhancedVimeoEmbedUrl(
          "https://player.vimeo.com/video/984159615?dnt=false&foo=bar",
        ),
      ).toBe("https://player.vimeo.com/video/984159615?dnt=true&foo=bar")
    })
  })

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
        {
          url: "https://youtube.com/embed/dQw4w9WgXcQ?start=30",
          expected: "dQw4w9WgXcQ",
        },
        {
          url: "https://youtube-nocookie.com/embed/dQw4w9WgXcQ?controls=0",
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

  describe("YouTube thumbnail helpers", () => {
    it("prefers sddefault when oEmbed returns hqdefault thumbnail", () => {
      expect(
        getPreferredYouTubeThumbnailUrl(
          "https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg",
        ),
      ).toBe("https://i.ytimg.com/vi/jNQXAC9IVRw/sddefault.jpg")
    })

    it("falls back to hqdefault when sddefault placeholder dimensions are detected", () => {
      const shouldFallback = shouldFallbackToHqYouTubeThumbnail({
        src: "https://i.ytimg.com/vi/jNQXAC9IVRw/sddefault.jpg",
        naturalWidth: 120,
        naturalHeight: 90,
      })

      expect(shouldFallback).toBe(true)
      expect(
        getHqYouTubeThumbnailUrl(
          "https://i.ytimg.com/vi/jNQXAC9IVRw/sddefault.jpg",
        ),
      ).toBe("https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg")
    })

    it("does not fallback when dimensions differ from YouTube missing-thumbnail placeholder", () => {
      expect(
        shouldFallbackToHqYouTubeThumbnail({
          src: "https://i.ytimg.com/vi/jNQXAC9IVRw/sddefault.jpg",
          naturalWidth: 640,
          naturalHeight: 480,
        }),
      ).toBe(false)
    })

    it("does not fallback for non-sddefault thumbnails", () => {
      expect(
        shouldFallbackToHqYouTubeThumbnail({
          src: "https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg",
          naturalWidth: 120,
          naturalHeight: 90,
        }),
      ).toBe(false)
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
