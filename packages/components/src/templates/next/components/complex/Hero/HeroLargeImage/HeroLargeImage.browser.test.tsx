import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { generateSiteConfig } from "~/stories/helpers"

import { HeroLargeImage } from "./HeroLargeImage"

describe("hero large image", () => {
  it("applies the focal point to the image", () => {
    const view = render(
      <HeroLargeImage
        type="hero"
        variant="largeImage"
        headingLevel={1}
        site={generateSiteConfig()}
        title="Title"
        backgroundUrl="/a.png"
        backgroundUrlImageAdjustment={{
          crop: { x: 0, y: 0, width: 1, height: 1 },
          focal: { x: 0, y: 1 },
          originalKey: "1/00000000-0000-0000-0000-000000000000/original.jpg",
        }}
      />,
    )

    expect(view.container.querySelector("img")?.style.objectPosition).toBe(
      "0% 100%",
    )
  })
})
