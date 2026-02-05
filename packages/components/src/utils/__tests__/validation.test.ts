import { describe, expect, it } from "vitest"

import {
  LINK_HREF_PATTERN,
  MAPS_EMBED_URL_PATTERN,
  VIDEO_EMBED_URL_PATTERN,
} from "../validation"

describe("validation", () => {
  describe("LINK_HREF_PATTERN", () => {
    it("should allow external URLs beginning with https://", () => {
      const testCases = [
        "https://example.com",
        "https://www.example.net",
        "https://subdomain.example.gov.sg",
        "https://very-nested.subsub.subdomain.example.gov.sg",
        "https://gov.sg",
      ]

      testCases.forEach((testCase) => {
        const result = new RegExp(LINK_HREF_PATTERN).test(testCase)
        expect(result).toBe(true)
      })
    })

    it("should allow mailto links", () => {
      const testCases = [
        "test@example.com",
        "support@agency.gov.sg",
        "contact@subdomain.agency-name.gov.sg",
        "Capital_Letters@example.gov.sg",
      ]

      testCases
        .map((testCase) => `mailto:${testCase}`)
        .forEach((testCase) => {
          const result = new RegExp(LINK_HREF_PATTERN).test(testCase)
          expect(result).toBe(true)
        })
    })

    it("should allow tel links", () => {
      const testCases = [
        "tel:12345678",
        "tel:+6512345678",
        "tel:+65-1234-5678",
        "tel:+65 1234 5678",
        "tel:1800 123 4567",
      ]

      testCases.forEach((testCase) => {
        const result = new RegExp(LINK_HREF_PATTERN).test(testCase)
        expect(result).toBe(true)
      })
    })

    it("should allow sms links", () => {
      const testCases = [
        "sms:12345678",
        "sms:+6512345678",
        "sms:+6512345678?body=Hello",
      ]

      testCases.forEach((testCase) => {
        const result = new RegExp(LINK_HREF_PATTERN).test(testCase)
        expect(result).toBe(true)
      })
    })

    it("should allow internal links", () => {
      const testCases = [
        "[resource:1:2]",
        "[resource:123:456]",
        "[resource:999:999]",
      ]

      testCases.forEach((testCase) => {
        const result = new RegExp(LINK_HREF_PATTERN).test(testCase)
        expect(result).toBe(true)
      })
    })

    it("should allow files links", () => {
      const testCases = [
        "/1/dc2b609a-355e-406c-af6c-003683731e7e/RFP%20Template.docx",
        "/123/29591b8d-f1e4-489a-b10a-0ced3141a335/sample.pdf",
        "/999/ccc57360-c82e-4e6c-882e-593f230958f6/padlock.svg",
        "/22/b7da536d-693b-408a-b79b-17ce861afaeb/lock.png",
        "/430/e57f4738-7bf2-490a-a083-0a8c166e4bfb/favicon.ico",
      ]

      testCases.forEach((testCase) => {
        const result = new RegExp(LINK_HREF_PATTERN).test(testCase)
        expect(result).toBe(true)
      })
    })

    it("should allow legacy internal links", () => {
      const testCases = [
        "/",
        "/about/senior-management",
        "/contact",
        "/files/annual-report.pdf",
        "/images/logo.png",
      ]

      testCases.forEach((testCase) => {
        const result = new RegExp(LINK_HREF_PATTERN).test(testCase)
        expect(result).toBe(true)
      })
    })

    it("should not allow external links with protocols other than https, tel, sms and mailto", () => {
      const testCases = ["http://example.com", "ftp://example.net"]

      testCases.forEach((testCase) => {
        const result = new RegExp(LINK_HREF_PATTERN).test(testCase)
        expect(result).toBe(false)
      })
    })
  })

  describe("MAPS_EMBED_URL_PATTERN", () => {
    it("should allow Google Maps embed URLs", () => {
      const testCases = [
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.473373876674!2d103.8486973142665!3d1.3035969990313745!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da19b8b4c6e1e1%3A0x2f1f6b8f0a1b2a7d!2sMinistry%20of%20Communications%20and%20Information!5e0!3m2!1sen!2ssg!4v1632291134655!5m2!1sen!2ssg",
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.473373876674!2d103.8486973142665!3d1.3035969990313745!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da19b8b4c6e1e1%3A0x2f1f6b8f0a1b2a7d!2sMinistry%20of%20Communications%20and%20Information!5e0!3m2!1en!2sg!4v1632291134655!5m2!1en!2sg",
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d997.1986718091739!2d103.84951406959217!3d1.2979038406790597!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da19ec2599519d%3A0x809fd655663da6d0!2sLazada%20One!5e0!3m2!1sen!2ssg!4v1731681752852!5m2!1sen!2ssg",
      ]

      testCases.forEach((testCase) => {
        const result = new RegExp(MAPS_EMBED_URL_PATTERN).test(testCase)
        expect(result).toBe(true)
      })
    })

    it("should allow Google My Maps embed URLs", () => {
      const testCases = [
        "https://www.google.com/maps/d/embed?mid=1Mgnp3R1e7rYXGY2Vn1efD-AWXlfZa8o&ehbc=2E312F",
      ]

      testCases.forEach((testCase) => {
        const result = new RegExp(MAPS_EMBED_URL_PATTERN).test(testCase)
        expect(result).toBe(true)
      })
    })

    it("should allow OneMap embed URLs", () => {
      const testCases = [
        "https://www.onemap.gov.sg/minimap/minimap.html?mapStyle=Default&zoomLevel=15&latLng=1.29793747849037,103.850182257356&ewt=JTNDcCUzRSUzQ3N0cm9uZyUzRU9wZW4lMjBHb3Zlcm5tZW50JTIwUHJvZHVjdHMlMjBvZmZpY2UlM0MlMkZzdHJvbmclM0UlM0MlMkZwJTNF&popupWidth=200&showPopup=true",
        "https://www.onemap.gov.sg/amm/amm.html?mapStyle=Default&zoomLevel=15&marker=postalcode:189554!colour:darkblue&marker=postalcode:068877!colour:red&marker=postalcode:179097!colour:red&popupWidth=200",
      ]

      testCases.forEach((testCase) => {
        const result = new RegExp(MAPS_EMBED_URL_PATTERN).test(testCase)
        expect(result).toBe(true)
      })
    })

    it("should allow OGP Maps embed URLs", () => {
      const testCases = [
        "https://maps.gov.sg/scdf-aed",
        "https://maps.gov.sg/alphanumeric12354",
        "https://maps.gov.sg/alphabets",
        "https://maps.gov.sg/1234567890",
        "https://maps.gov.sg/abc-def_ghi-jkl",
      ]

      testCases.forEach((testCase) => {
        const result = new RegExp(MAPS_EMBED_URL_PATTERN).test(testCase)
        expect(result).toBe(true)
      })
    })

    it("should not allow any other site's URLs", () => {
      const testCases = [
        "https://www.example.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.473373876674!2d103.8486973142665!3d1.3035969990313745!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da19b8b4c6e1e1%3A0x2f1f6b8f0a1b2a7d!2sMinistry%20of%20Communications%20and%20Information!5e0!3m2!1sen!2ssg!4v1632291134655!5m2!1en!2sg",
        "https://www.google.com/maps?pb=!1m18!1m12!1m3!1d3961.473373876674!2d103.8486973142665!3d1.3035969990313745!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da19b8b4c6e1e1%3A0x2f1f6b8f0a1b2a7d!2sMinistry%20of%20Communications%20and%20Information!5e0!3m2!1en!2sg!4v1632291134655!5m2!1en!2sg",
        "https://www.google.com/maps/eee/embed?mid=1Mgnp3R1e7rYXGY2Vn1efD-AWXlfZa8o&ehbc=2E312F",
        "https://www.google.fakesite.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.473373876674!2d103.8486973142665!3d1.3035969990313745!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da19b8b4c6e1e1%3A0x2f1f6b8f0a1b2a7d!2sMinistry%20of%20Communications%20and%20Information!5e0!3m2!1sen!2ssg!4v1632291134655!5m2!1en!2sg",
        "https://www.onemap.gov.sg/minimap/amm.html?mapStyle=Default&zoomLevel=15&marker=postalcode:189554!colour:darkblue&marker=postalcode:068877!colour:red&marker=postalcode:179097!colour:red&popupWidth=200",
      ]

      testCases.forEach((testCase) => {
        const result = new RegExp(MAPS_EMBED_URL_PATTERN).test(testCase)
        expect(result).toBe(false)
      })
    })
  })

  describe("VIDEO_EMBED_URL_PATTERN", () => {
    it("should allow YouTube watch URLs", () => {
      const testCases = [
        "https://www.youtube.com/watch?v=abcdefg",
        "https://www.youtube.com/watch?v=123456",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be",
      ]

      testCases.forEach((testCase) => {
        const result = new RegExp(VIDEO_EMBED_URL_PATTERN).test(testCase)
        expect(result).toBe(true)
      })
    })

    it("should allow YouTube embed URLs", () => {
      const testCases = [
        "https://www.youtube.com/embed/abcdefg",
        "https://www.youtube.com/embed/123456",
        "https://www.youtube.com/embed/videoseries?si=ERNlpee6I1tOFxP1&amp;list=PL8H4HE5h1ju2mleR8sNaWzRAnRkFcYvg-",
        "https://www.youtube.com/embed/dQw4w9WgXcQ?si=7dAKYmJw2jTNNqkr",
        "https://www.youtube.com/embed/dQw4w9WgXcQ?si=7dAKYmJw2jTNNqkr&amp;start=60",
        "https://www.youtube.com/embed/dQw4w9WgXcQ?si=7dAKYmJw2jTNNqkr&amp;controls=0",
        "https://www.youtube.com/embed/dQw4w9WgXcQ?si=7dAKYmJw2jTNNqkr&amp;controls=0&amp;start=60",
      ]

      testCases.forEach((testCase) => {
        const result = new RegExp(VIDEO_EMBED_URL_PATTERN).test(testCase)
        expect(result).toBe(true)
      })
    })

    it("should allow YouTube nocookie embed URLs", () => {
      const testCases = [
        "https://www.youtube-nocookie.com/embed/abcdefg",
        "https://www.youtube-nocookie.com/embed/123456",
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?si=7dAKYmJw2jTNNqkr&amp;controls=0",
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?si=7dAKYmJw2jTNNqkr&amp;controls=0&amp;start=60",
      ]

      testCases.forEach((testCase) => {
        const result = new RegExp(VIDEO_EMBED_URL_PATTERN).test(testCase)
        expect(result).toBe(true)
      })
    })

    it("should allow Vimeo embed URLs", () => {
      const testCases = [
        "https://player.vimeo.com/video/984159615?h=945031e683",
      ]

      testCases.forEach((testCase) => {
        const result = new RegExp(VIDEO_EMBED_URL_PATTERN).test(testCase)
        expect(result).toBe(true)
      })
    })

    it("should allow Facebook Watch embed URLs", () => {
      const testCases = [
        "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2FCLCsg%2Fvideos%2F443087086248211%2F&show_text=0&width=560",
      ]

      testCases.forEach((testCase) => {
        const result = new RegExp(VIDEO_EMBED_URL_PATTERN).test(testCase)
        expect(result).toBe(true)
      })
    })

    it("should not allow any other site's URLs", () => {
      const testCases = [
        "https://www.example.com/embed/abcdefg",
        "https://www.another-site.com/watch?v=abcdefg",
        "https://youtu.be/dQw4w9WgXcQ",
        "https://www.youtube.fakesite.com/watch?v=dQw4w9WgXcQ&feature=youtu.be",
      ]

      testCases.forEach((testCase) => {
        const result = new RegExp(VIDEO_EMBED_URL_PATTERN).test(testCase)
        expect(result).toBe(false)
      })
    })
  })
})
