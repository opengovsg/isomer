import type {
  IsomerSitemap,
  IsomerSiteWideComponentsProps,
} from "@opengovsg/isomer-components"

import { trpcMsw } from "../mockTrpc"

const defaultSiteConfig = {
  theme: "isomer-next" as const,
  isGovernment: true,
  sitemap: {
    permalink: "/",
    lastModified: "2024-07-18T03:20:47.882Z",
    layout: "homepage",
    title: "SPC Homepage",
    summary: "",
  } satisfies IsomerSitemap,
  name: "Test Site",
}

const defaultFooter = {
  content: {
    siteNavItems: [
      {
        title: "Home",
        url: "/",
      },
    ],
    privacyStatementLink: "",
    termsOfUseLink: "",
  } satisfies IsomerSiteWideComponentsProps["footerItems"],
  id: 1,
  siteId: 1,
}

const defaultNavbar = {
  content: {
    items: [
      {
        name: "Home",
        url: "/",
      },
    ] satisfies IsomerSiteWideComponentsProps["navBarItems"],
  },
  id: 1,
  siteId: 1,
}

const defaultConfigGetQuery = () => {
  return trpcMsw.site.getConfig.query(() => defaultSiteConfig)
}

const defaultFooterGetQuery = () => {
  return trpcMsw.site.getFooter.query(() => defaultFooter)
}

const defaultNavbarGetQuery = () => {
  return trpcMsw.site.getNavbar.query(() => defaultNavbar)
}

export const siteHandlers = {
  getConfig: defaultConfigGetQuery,
  getFooter: defaultFooterGetQuery,
  getNavbar: defaultNavbarGetQuery,
}
