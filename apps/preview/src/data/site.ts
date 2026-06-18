import type { IsomerSiteProps } from "@opengovsg/isomer-components"

function getSitemapAsArray(
  node: IsomerSiteProps["siteMap"],
): IsomerSiteProps["siteMapArray"] {
  const result: IsomerSiteProps["siteMapArray"] = []
  function traverse(n: typeof node) {
    result.push(n)
    n.children?.forEach(traverse)
  }
  traverse(node)
  return result
}

export function makeSite(
  overrides?: Partial<IsomerSiteProps>,
): IsomerSiteProps {
  const defaults: IsomerSiteProps = {
    siteName: "Isomer Next",
    siteMap: {
      id: "1",
      title: "Home",
      permalink: "/",
      lastModified: "",
      layout: "homepage",
      summary: "",
      children: [],
    },
    siteMapArray: [],
    theme: "isomer-next",
    isGovernment: true,
    url: "https://www.isomer.gov.sg",
    logoUrl: "/isomer-logo.svg",
    navbar: {
      items: [
        { name: "Home", url: "/" },
        {
          name: "Newsroom",
          url: "/newsroom",
          items: [{ name: "News", url: "/newsroom/news" }],
        },
      ],
    },
    footerItems: {
      privacyStatementLink: "https://www.isomer.gov.sg/privacy",
      termsOfUseLink: "https://www.isomer.gov.sg/terms",
      siteNavItems: [],
    },
    lastUpdated: "1 Jan 2021",
    search: { type: "localSearch", searchUrl: "/search" },
  }
  const site = { ...defaults, ...overrides }
  return { ...site, siteMapArray: getSitemapAsArray(site.siteMap) }
}
