import type { IsomerSiteProps } from "~/types"
import { getSitemapAsArray } from "~/utils/getSitemapAsArray"

export const generateSiteConfig = (
  overrides?: Partial<IsomerSiteProps>,
): IsomerSiteProps => {
  const defaultConfig: IsomerSiteProps = {
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
        {
          name: "Home",
          url: "/",
        },
        {
          name: "Newsroom",
          url: "/newsroom",
          items: [
            {
              name: "News",
              url: "/newsroom/news",
            },
          ],
        },
      ],
    },
    footerItems: {
      privacyStatementLink: "https://www.isomer.gov.sg/privacy",
      termsOfUseLink: "https://www.isomer.gov.sg/terms",
      siteNavItems: [],
    },
    lastUpdated: "1 Jan 2021",
    search: {
      type: "localSearch",
      searchUrl: "/search",
    },
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
