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
    logoUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='32' viewBox='0 0 120 32'%3E%3Crect width='120' height='32' rx='4' fill='%23d1d5db'/%3E%3C/svg%3E",
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
