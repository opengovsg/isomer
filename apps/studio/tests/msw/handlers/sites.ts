import type { DelayMode } from "msw"
import { delay } from "msw"

import { MOCK_STORY_DATE } from "../constants"
import { trpcMsw } from "../mockTrpc"

const siteListQuery = ({
  wait,
  isEmpty,
}: {
  wait?: DelayMode | number
  isEmpty?: boolean
} = {}) => {
  return trpcMsw.site.list.query(async () => {
    if (wait !== undefined) {
      await delay(wait)
    }

    if (isEmpty) {
      return []
    }

    return [
      {
        id: 1,
        name: "Ministry of Trade and Industry",
        config: {
          theme: "isomer-next",
          siteName: "MTI",
          logoUrl: "",
          search: undefined,
          isGovernment: true,
        } as PrismaJson.SiteJsonConfig,
      },
      {
        id: 2,
        name: "Having a really long name is cool i guess",
        config: {
          theme: "isomer-next",
          siteName: "MTI",
          logoUrl: "",
          search: undefined,
          isGovernment: true,
        } as PrismaJson.SiteJsonConfig,
      },
      {
        id: 3,
        name: "But not if it's too long then nobody can read your name anyway so why even bother",
        config: {
          theme: "isomer-next",
          siteName: "MTI",
          logoUrl: "",
          search: undefined,
          isGovernment: true,
        } as PrismaJson.SiteJsonConfig,
      },
    ]
  })
}

export const sitesHandlers = {
  list: {
    default: () => siteListQuery({}),
    loading: () => siteListQuery({ wait: "infinite" }),
    empty: () => siteListQuery({ isEmpty: true }),
  },
  getSiteName: {
    default: () => {
      return trpcMsw.site.getSiteName.query(() => {
        return { name: "Isomer" }
      })
    },
  },
  getTheme: {
    default: () => {
      return trpcMsw.site.getTheme.query(() => {
        return {
          colors: {
            brand: {
              canvas: {
                default: "#e6ecef",
                alt: "#bfcfd7",
                backdrop: "#80a0af",
                inverse: "#00405f",
              },
              interaction: {
                default: "#00405f",
                hover: "#002e44",
                pressed: "#00283b",
              },
            },
          },
        } as PrismaJson.SiteThemeJson
      })
    },
  },
  getConfig: {
    default: () => {
      return trpcMsw.site.getConfig.query(() => {
        return {
          theme: "isomer-next",
          siteName: "Ministry of Test and Industry",
          search: undefined,
          agencyName: "Ministry of Test and Industry",
          isGovernment: true,
          logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
        } as PrismaJson.SiteJsonConfig
      })
    },
  },
  getFooter: {
    default: () => {
      return trpcMsw.site.getFooter.query(() => {
        return {
          id: 1,
          siteId: 1,
          content: {
            siteNavItems: [
              {
                url: "/about",
                title: "About us",
              },
              {
                url: "/partners",
                title: "Our partners",
              },
              {
                url: "/grants-and-programmes",
                title: "Grants and programmes",
              },
              {
                url: "/contact-us",
                title: "Contact us",
              },
              {
                url: "/something-else",
                title: "Something else",
              },
              {
                url: "/resources",
                title: "Resources",
              },
            ],
            contactUsLink: "/contact-us",
            termsOfUseLink: "/terms-of-use",
            feedbackFormLink: "https://www.form.gov.sg",
            privacyStatementLink: "/privacy",
          } as PrismaJson.FooterJsonContent,
          createdAt: MOCK_STORY_DATE,
          updatedAt: MOCK_STORY_DATE,
        }
      })
    },
  },
  getNavbar: {
    default: () => {
      return trpcMsw.site.getNavbar.query(() => {
        return {
          id: 1,
          siteId: 1,
          content: {
            items: [
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
          } as PrismaJson.NavbarJsonContent,
          createdAt: MOCK_STORY_DATE,
          updatedAt: MOCK_STORY_DATE,
        }
      })
    },
  },
  getLocalisedSitemap: {
    default: () => {
      return trpcMsw.site.getLocalisedSitemap.query(() => {
        return {
          id: "1",
          layout: "content",
          title: "Home",
          summary: "",
          lastModified: "2024-09-16T04:34:54.838Z",
          permalink: "/",
          children: [
            {
              id: "4",
              layout: "content",
              title: "article layout",
              summary: "",
              lastModified: "2024-09-16T04:34:54.838Z",
              permalink: "/article-layout",
            },
            {
              id: "3",
              layout: "content",
              title: "Page title here",
              summary: "",
              lastModified: "2024-09-16T04:34:54.838Z",
              permalink: "/page-title-here",
            },
          ],
        }
      })
    },
  },
}
