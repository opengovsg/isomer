import { describe, expect, it } from "vitest"
import { generateSiteConfig } from "~/stories/helpers"

import { ImageGallery } from "../ImageGallery"

describe("ImageGallery", () => {
  // The client component's props are serialised into the page HTML.
  it("does not pass the image adjustment to the client component", () => {
    const element = ImageGallery({
      type: "imagegallery",
      site: generateSiteConfig(),
      images: [
        {
          src: "/a.png",
          alt: "A",
          srcImageAdjustment: {
            crop: { x: 0, y: 0, width: 1, height: 1 },
            focal: { x: 0.5, y: 0.5 },
            originalKey: "1/uuid/original.jpg",
          },
        },
      ],
    })

    expect(JSON.stringify(element.props)).not.toContain("originalKey")
    expect(element.props.images).toEqual([{ src: "/a.png", alt: "A" }])
  })
})
