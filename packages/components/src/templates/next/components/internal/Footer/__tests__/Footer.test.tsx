import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { generateSiteConfig } from "~/stories/helpers"

import { Footer } from "../Footer"

describe("Footer", () => {
  it("defines each credit logo once and references it from both layouts", () => {
    // Arrange
    const footer = (
      <Footer
        site={generateSiteConfig()}
        siteName="Ministry of Trade and Industry"
        agencyName="Open Government Products"
        isGovernment
        lastUpdated="11 Mar 2024"
        siteNavItems={[{ title: "About us", url: "/" }]}
      />
    )

    // Act
    const html = renderToStaticMarkup(footer)

    // Assert — mobile and desktop each reference the shared symbols
    expect(html.match(/id="isomer-logo"/g)?.length).toBe(1)
    expect(html.match(/id="ogp-logo"/g)?.length).toBe(1)
    expect(html.match(/href="#isomer-logo"/g)?.length).toBe(2)
    expect(html.match(/href="#ogp-logo"/g)?.length).toBe(2)

    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
    expect(duplicateIds).toEqual([])

    // Wordmark path data lives only in the symbol, not in each <use>
    expect(html.match(/M105\.842 24\.1243/g)?.length).toBe(1)
    expect(html.match(/M54\.0417 4\.53023/g)?.length).toBe(1)
  })
})
