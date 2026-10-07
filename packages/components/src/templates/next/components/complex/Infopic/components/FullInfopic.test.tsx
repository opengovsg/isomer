import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { generateSiteConfig } from "~/stories/helpers"

import { Infopic } from "../Infopic"

describe("FullInfopic", () => {
  it("renders the photo in an img so the browser can apply EXIF orientation", () => {
    // Arrange
    const html = renderToStaticMarkup(
      <Infopic
        variant="full"
        title="Neighbourhood"
        description="A park"
        imageSrc="/photos/portrait.jpg"
        imageAlt="Residents in a park"
        site={generateSiteConfig({
          assetsBaseUrl: "https://assets.example.gov.sg",
        })}
        headingLevel={2}
      />,
    )

    // Assert — CSS background-image ignores EXIF orientation (rotation and
    // flips). An img does not, which is how the file looks on the uploader's
    // computer.
    expect(html).toContain(
      'src="https://assets.example.gov.sg/photos/portrait.jpg"',
    )
    expect(html).toContain('alt="Residents in a park"')
    expect(html).toContain("object-cover")
    expect(html).not.toContain("background-image")
    expect(html).not.toContain("backgroundImage")
  })
})
