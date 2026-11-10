import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { generateSiteConfig } from "~/stories/helpers/generateSiteConfig"

import { InfoCardImage } from "../InfoCardImage"

const site = generateSiteConfig()
const imageAdjustment = {
  crop: { x: 0, y: 0, width: 1, height: 1 },
  focal: { x: 0.25, y: 0.75 },
  originalKey: "1/uuid/original.png",
}

describe("InfoCardImage", () => {
  it("applies the focal point as object-position under imageFit cover", () => {
    const html = renderToStaticMarkup(
      <InfoCardImage
        imageUrl="/1/uuid/file.png"
        imageAlt="alt"
        imageFit="cover"
        imageUrlImageAdjustment={imageAdjustment}
        maxColumns="3"
        layout="content"
        site={site}
      />,
    )

    expect(html).toContain("object-position:25% 75%")
  })

  it("drops the focal point under imageFit contain (the whole image is letterboxed)", () => {
    const html = renderToStaticMarkup(
      <InfoCardImage
        imageUrl="/1/uuid/file.png"
        imageAlt="alt"
        imageFit="contain"
        imageUrlImageAdjustment={imageAdjustment}
        maxColumns="3"
        layout="content"
        site={site}
      />,
    )

    expect(html).not.toContain("object-position")
  })
})
