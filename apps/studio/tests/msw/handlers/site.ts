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

const defaultConfigGetQuery = () => {
  return trpcMsw.site.getConfig.query(() => defaultSiteConfig)
}

const defaultFooterGetQuery = () => {
  return trpcMsw.site.getFooter.query(() => defaultFooter)
}

const defaultNavbarGetQuery = () => {
  return trpcMsw.site.getNavbar.query(() => {
    return {
      id: 1,
      siteId: 1,
      content: [
        {
          url: "/item-one",
          name: "Expandable nav item",
          items: [
            {
              url: "/item-one/pa-network-one",
              name: "PA's network one",
              description:
                "Click here and brace yourself for mild disappointment.",
            },
            {
              url: "/item-one/pa-network-two",
              name: "PA's network two",
              description:
                "Click here and brace yourself for mild disappointment.",
            },
            {
              url: "/item-one/pa-network-three",
              name: "PA's network three",
            },
            {
              url: "/item-one/pa-network-four",
              name: "PA's network four",
              description:
                "Click here and brace yourself for mild disappointment. This one has a pretty long one",
            },
            {
              url: "/item-one/pa-network-five",
              name: "PA's network five",
              description:
                "Click here and brace yourself for mild disappointment. This one has a pretty long one",
            },
            {
              url: "/item-one/pa-network-six",
              name: "PA's network six",
              description:
                "Click here and brace yourself for mild disappointment.",
            },
          ],
        },
      ],
    }
  })
}

export const siteHandlers = {
  getConfig: defaultConfigGetQuery,
  getFooter: defaultFooterGetQuery,
  getNavbar: defaultNavbarGetQuery,
}
