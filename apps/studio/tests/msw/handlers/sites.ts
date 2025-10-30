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
          url: "https://www.isomer.gov.sg",
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
          url: "https://www.isomer.gov.sg",
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
          url: "https://www.isomer.gov.sg",
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
          url: "https://www.isomer.gov.sg",
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

    collection: () => {
      return trpcMsw.site.getLocalisedSitemap.query(() => {
        return {
          id: "1",
          layout: "collection",
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
              permalink: "/collection/article-layout",
            },
            {
              id: "3",
              layout: "content",
              title: "Page title here",
              summary: "",
              lastModified: "2024-09-16T04:34:54.838Z",
              permalink: "/collection/page-title-here",
            },
          ],
          collectionPagePageProps: {
            tagCategories: [
              {
                label: "Topic",
                id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
                options: [
                  {
                    label: "Technology",
                    id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
                  },
                  {
                    label: "Science",
                    id: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
                  },
                  {
                    label: "Health",
                    id: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
                  },
                ],
              },
              {
                label: "Empty Category",
                id: "123e4567-e89b-12d3-a456-426614174000",
                options: [],
              },
              {
                label: "Industries",
                id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
                options: [
                  {
                    label: "Agriculture & Food",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
                  },
                  {
                    label: "Automotive",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12",
                  },
                  {
                    label: "Banking & Finance",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13",
                  },
                  {
                    label: "Biotechnology",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14",
                  },
                  {
                    label: "Construction",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15",
                  },
                  {
                    label: "Defense",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16",
                  },
                  {
                    label: "Education",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17",
                  },
                  {
                    label: "Electronics",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18",
                  },
                  {
                    label: "Energy & Utilities",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19",
                  },
                  {
                    label: "Entertainment",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a1a",
                  },
                  {
                    label: "Healthcare",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a1b",
                  },
                  {
                    label: "Hospitality & Tourism",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a1c",
                  },
                  {
                    label: "Information Technology",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a1d",
                  },
                  {
                    label: "Insurance",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a1e",
                  },
                  {
                    label: "Legal Services",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a1f",
                  },
                  {
                    label: "Logistics & Transportation",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20",
                  },
                  {
                    label: "Manufacturing",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21",
                  },
                  {
                    label: "Maritime",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
                  },
                  {
                    label: "Media & Communications",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23",
                  },
                  {
                    label: "Pharmaceuticals",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24",
                  },
                  {
                    label: "Real Estate",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a25",
                  },
                  {
                    label: "Retail & Commerce",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26",
                  },
                  {
                    label: "Telecommunications",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27",
                  },
                  {
                    label: "Textiles & Apparel",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28",
                  },
                  {
                    label:
                      "This is a random industry that has a very long text and might overflow. what do we do with this industry? i don't know",
                    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a29",
                  },
                ],
              },
            ],
            defaultSortBy: "date",
            defaultSortDirection: "desc",
          },
        }
      })
    },

    index: () => {
      return trpcMsw.site.getLocalisedSitemap.query(() => {
        return {
          id: "1",
          layout: "homepage",
          title: "Home",
          summary: "",
          lastModified: "2025-04-24T08:08:01.349Z",
          permalink: "/",
          children: [
            {
              id: "2",
              layout: "content",
              title: "test",
              summary: "",
              lastModified: "2025-04-24T08:08:01.349Z",
              permalink: "/parent",
              children: [
                {
                  id: "5",
                  layout: "content",
                  title: "sibling1",
                  summary: "",
                  lastModified: "2025-04-24T08:08:01.349Z",
                  permalink: "/parent/sibling1",
                  children: [],
                },
                {
                  id: "4",
                  layout: "content",
                  title: "sibling2",
                  summary: "",
                  lastModified: "2025-04-24T08:08:01.349Z",
                  permalink: "/parent/sibling2",
                },
              ],
            },
          ],
        }
      })
    },
  },

  getNotification: {
    default: () => {
      return trpcMsw.site.getNotification.query(() => {
        return {
          notification: {
            title: "hello world",
            enabled: true,
            content: {
              type: "prose",
              content: [
                {
                  type: "paragraph",
                  attrs: {
                    dir: "ltr",
                  },
                  content: [
                    {
                      text: "i love ",
                      type: "text",
                      marks: [
                        {
                          type: "bold",
                        },
                      ],
                    },
                    {
                      text: "Isomer ",
                      type: "text",
                      marks: [
                        {
                          type: "bold",
                        },
                        {
                          type: "italic",
                        },
                      ],
                    },
                    {
                      text: "alot ",
                      type: "text",
                      marks: [
                        {
                          type: "italic",
                        },
                      ],
                    },
                    {
                      text: "because ",
                      type: "text",
                      marks: [
                        {
                          type: "italic",
                        },
                        {
                          type: "underline",
                        },
                      ],
                    },
                    {
                      text: "the ui ",
                      type: "text",
                      marks: [
                        {
                          type: "underline",
                        },
                      ],
                    },
                    {
                      text: "is nice",
                      type: "text",
                      marks: [
                        {
                          type: "italic",
                        },
                        {
                          type: "underline",
                        },
                        {
                          type: "link",
                          attrs: {
                            href: "[resource:4:16]",
                            target: "_self",
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        }
      })
    },

    title: () => {
      return trpcMsw.site.getNotification.query(() => {
        return {
          notification: {
            title: "hello world",
            enabled: true,
            content: {
              type: "prose",
              content: [],
            },
          },
        }
      })
    },

    disabled: () => {
      return trpcMsw.site.getNotification.query(() => {
        return {
          notification: {
            title: "hello world",
            enabled: false,
            content: {
              type: "prose",
              content: [],
            },
          },
        }
      })
    },

    empty: () => {
      return trpcMsw.site.getNotification.query(() => {
        return {
          notification: {
            title: "",
            enabled: true,
            content: {
              type: "prose",
              content: [],
            },
          },
        }
      })
    },

    long: () => {
      return trpcMsw.site.getNotification.query(() => {
        return {
          notification: {
            title:
              "This is a very long title that should be exactly 100 words long - i am just typing random stuff here",
            enabled: true,
            content: {
              type: "prose",
              content: [],
            },
          },
        }
      })
    },
  },
}
