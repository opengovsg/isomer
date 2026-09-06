import type { IsomerSiteProps } from "~/types"
import { getSitemapAsArray } from "~/utils/getSitemapAsArray"

export const generateSiteConfig = (
  overrides?: Partial<IsomerSiteProps>,
): IsomerSiteProps => {
  const defaultConfig: IsomerSiteProps = {
    footerItems: {
      privacyStatementLink: "https://www.isomer.gov.sg/privacy",
      siteNavItems: [],
      termsOfUseLink: "https://www.isomer.gov.sg/terms",
    },
    isGovernment: true,
    lastUpdated: "1 Jan 2021",
    logoUrl: "/isomer-logo.svg",
    navbar: {
      items: [
        {
          name: "Home",
          url: "/",
        },
        {
          items: [
            {
              name: "News",
              url: "/newsroom/news",
            },
          ],
          name: "Newsroom",
          url: "/newsroom",
        },
      ],
    },
    search: {
      searchUrl: "/search",
      type: "localSearch",
    },
    siteMap: {
      children: [],
      id: "1",
      lastModified: "",
      layout: "homepage",
      permalink: "/",
      summary: "",
      title: "Home",
    },
    siteMapArray: [],
    siteName: "Isomer Next",
    theme: "isomer-next",
    url: "https://www.isomer.gov.sg",
  }

  const site: IsomerSiteProps = {
    ...defaultConfig,
    ...overrides,
  }

  return {
    ...site,
    siteMapArray: getSitemapAsArray(site.siteMap),
  }
}
