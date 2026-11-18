import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { generateSiteConfig } from "~/stories/helpers"

import { Footer } from "../Footer"

describe("Footer", () => {
  it("renders footer credit logos once without duplicate svg ids", () => {
    const html = renderToStaticMarkup(
      <Footer
        site={generateSiteConfig()}
        siteName="Ministry of Trade and Industry"
        agencyName="Open Government Products"
        isGovernment
        lastUpdated="11 Mar 2024"
        siteNavItems={[{ title: "About us", url: "/" }]}
        customNavItems={[{ title: "Careers", url: "/" }]}
        socialMediaLinks={[
          { type: "facebook", url: "https://www.facebook.com" },
        ]}
        contactUsLink="/"
        feedbackFormLink="https://www.google.com"
        privacyStatementLink="/"
        termsOfUseLink="/"
      />,
    )

    expect(html).toContain("Made with")
    expect(html.match(/Made with/g)?.length).toBe(1)

    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
    expect(duplicateIds).toEqual([])
  })
})
