import type { DelayMode } from "msw"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { delay } from "msw"

import type { getPageById } from "~/server/modules/resource/resource.service"
import type { RouterOutput } from "~/utils/trpc"
import { trpcMsw } from "../mockTrpc"

const getRootPageQuery = (wait?: DelayMode | number) => {
  return trpcMsw.page.getRootPage.query(async () => {
    if (wait !== undefined) {
      await delay(wait)
    }
    return { title: "A mock page", id: "1", draftBlobId: "1" }
  })
}
export const DEFAULT_PAGE_ITEMS: RouterOutput["resource"]["listWithoutRoot"] = [
  {
    id: "1",
    permalink: "newsroom",
    title: "Press Releases",
    publishedVersionId: null,
    draftBlobId: null,
    type: "Collection",
    parentId: null,
    updatedAt: new Date("2024-09-12T07:00:00.000Z"),
  },
  {
    id: "4",
    permalink: "test-page-1",
    title: "Test page 1",
    publishedVersionId: null,
    draftBlobId: "3",
    type: "Page",
    parentId: null,
    updatedAt: new Date("2024-09-12T07:00:10.000Z"),
  },
  {
    id: "5",
    permalink: "test-page-2",
    title: "Test page 2",
    publishedVersionId: null,
    draftBlobId: "4",
    type: "Page",
    parentId: null,
    updatedAt: new Date("2024-09-12T07:00:20.000Z"),
  },
  {
    id: "6",
    permalink: "folder",
    title: "Test folder 1",
    publishedVersionId: null,
    draftBlobId: null,
    type: "Folder",
    parentId: null,
    updatedAt: new Date("2024-09-12T07:00:30.000Z"),
  },
]

const pageListQuery = (wait?: DelayMode | number) => {
  return trpcMsw.resource.listWithoutRoot.query(async () => {
    if (wait !== undefined) {
      await delay(wait)
    }
    return DEFAULT_PAGE_ITEMS
  })
}

export const pageHandlers = {
  getCategories: {
    default: () => {
      return trpcMsw.page.getCategories.query(() => {
        return {
          categories: ["Category 1", "Category 2", "Category 3"],
        }
      })
    },
  },
  updateSettings: {
    collection: () => {
      trpcMsw.page.updateSettings.mutation(() => {
        return {
          id: "1",
          title: "Press Releases",
          permalink: "/collection/page",
          draftBlobId: "1",
          type: ResourceType.CollectionPage,
        }
      })
    },
  },
  updatePageBlob: {
    default: () => {
      return trpcMsw.page.updatePageBlob.mutation(() => {
        return {
          siteId: 1,
          pageId: 1,
          content: {
            page: {
              date: "04/01/2024",
              title: "Mock story book page",
              category: "I love stories",
              permalink: "/debug",
              lastModified: "2025-02-05T03:22:09.593Z",
              articlePageHeader: {
                summary: "",
              },
            },
            layout: "article",
            content: [
              {
                type: "prose",
                content: [
                  {
                    type: "paragraph",
                    attrs: {
                      dir: null,
                    },
                  },
                ],
              },
            ],
            version: "0.1.0",
          },
        }
      })
    },
  },
  countWithoutRoot: {
    default: () =>
      trpcMsw.resource.countWithoutRoot.query(() => {
        return DEFAULT_PAGE_ITEMS.length
      }),
  },
  listWithoutRoot: {
    default: pageListQuery,
    loading: () => pageListQuery("infinite"),
  },
  getRootPage: {
    default: getRootPageQuery,
    loading: () => getRootPageQuery("infinite"),
  },
  readPageAndBlob: {
    homepage: () => {
      // @ts-expect-error incomplete types
      return trpcMsw.page.readPageAndBlob.query(() => {
        return {
          type: "RootPage",
          permalink: "home",
          title: "Home",
          updatedAt: new Date("2024-09-12T07:00:00.000Z"),
          navbar: {
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
            },
          },
          footer: {
            id: 1,
            siteId: 1,
            content: {
              siteNavItems: [
                { url: "/about", title: "About us" },
                { url: "/partners", title: "Our partners" },
                {
                  url: "/grants-and-programmes",
                  title: "Grants and programmes",
                },
                { url: "/contact-us", title: "Contact us" },
                { url: "/something-else", title: "Something else" },
                { url: "/resources", title: "Resources" },
              ],
              contactUsLink: "/contact-us",
              termsOfUseLink: "/terms-of-use",
              feedbackFormLink: "https://www.form.gov.sg",
              privacyStatementLink: "/privacy",
            },
          },
          content: {
            page: { title: "Home" },
            layout: "homepage",
            content: [
              {
                type: "hero",
                title: "Ministry of Trade and Industry",
                variant: "gradient",
                subtitle:
                  "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
                buttonUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                buttonLabel: "Main CTA",
                backgroundUrl:
                  "https://ohno.isomer.gov.sg/images/hero-banner.png",
                secondaryButtonUrl:
                  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                secondaryButtonLabel: "Sub CTA",
              },
              {
                type: "keystatistics",
                title: "Irrationality in numbers",
                statistics: [
                  {
                    label:
                      "Average all nighters pulled in a typical calendar month",
                    value: "3",
                  },
                  {
                    label: "Growth in tasks assigned Q4 2024 (YoY)",
                    value: "+12.2%",
                  },
                  {
                    label: "Creative blocks met per single evening",
                    value: "89",
                  },
                  { label: "Number of lies in this stat block", value: "4.0" },
                ],
              },
              {
                type: "infobar",
                title: "This is an infobar",
                description:
                  "This is the description that goes into the Infobar section",
              },
              {
                type: "infopic",
                title: "This is an infopic",
                imageSrc: "https://placehold.co/600x400",
              },
              {
                type: "infocards",
                title: "This is an infocards block",
                variant: "cardsWithoutImages",
                cards: [],
              },
              {
                type: "infocols",
                title: "This is an infocols block",
                infoBoxes: [],
              },
            ],
            version: "0.1.0",
          },
          theme: "isomer-next",
          logoUrl: "",
          siteName: "MTI",
          isGovernment: true,
        }
      })
    },
    content: () => {
      // @ts-expect-error incomplete types
      return trpcMsw.page.readPageAndBlob.query(() => {
        return {
          permalink: "page-title-here",
          title: "Content page",
          updatedAt: new Date("2024-09-12T07:00:00.000Z"),
          navbar: {
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
            },
          },
          footer: {
            id: 1,
            siteId: 1,
            content: {
              siteNavItems: [
                { url: "/about", title: "About us" },
                { url: "/partners", title: "Our partners" },
                {
                  url: "/grants-and-programmes",
                  title: "Grants and programmes",
                },
                { url: "/contact-us", title: "Contact us" },
                { url: "/something-else", title: "Something else" },
                { url: "/resources", title: "Resources" },
              ],
              contactUsLink: "/contact-us",
              termsOfUseLink: "/terms-of-use",
              feedbackFormLink: "https://www.form.gov.sg",
              privacyStatementLink: "/privacy",
            },
          },
          content: {
            page: {
              title: "Page title here",
              permalink: "page-title-here",
              lastModified:
                "Wed Sep 11 2024 16:32:44 GMT+0800 (Singapore Standard Time)",
              contentPageHeader: { summary: "" },
            },
            layout: "content",
            content: [
              {
                type: "prose",
                content: [
                  {
                    type: "paragraph",
                    content: [{ text: "This is a prose block", type: "text" }],
                  },
                ],
              },
              {
                type: "prose",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        text: "Thisisaproseblockthathasnospacesandshouldautomaticallytruncatetopreventoverflow",
                        type: "text",
                      },
                    ],
                  },
                ],
              },
              {
                type: "prose",
                content: [
                  {
                    type: "paragraph",
                    content: [],
                  },
                ],
              },
              {
                type: "image",
                src: "https://placehold.co/600x400",
                alt: "This is an image",
              },
              {
                type: "callout",
                content: {
                  type: "prose",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        { text: "This is a callout block", type: "text" },
                      ],
                    },
                  ],
                },
              },
              {
                type: "callout",
                content: {
                  type: "prose",
                  content: [
                    {
                      type: "paragraph",
                      content: [],
                    },
                  ],
                },
              },
              {
                type: "contentpic",
                content: {
                  type: "prose",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        { text: "This is a contentpic block", type: "text" },
                      ],
                    },
                  ],
                },
              },
              {
                type: "contentpic",
                content: {
                  type: "prose",
                  content: [],
                },
                imageSrc: "https://placehold.co/600x400",
              },
              {
                type: "infocards",
                title: "This is an infocards block",
                variant: "cardsWithoutImages",
                cards: [],
              },
              {
                type: "accordion",
                summary: "This is an accordion block",
                details: {
                  type: "prose",
                  content: [],
                },
              },
              {
                type: "infocols",
                title: "This is an infocols block",
                infoBoxes: [],
              },
              {
                type: "map",
                title: "Singapore region",
                url: "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d127639.0647119137!2d103.79481771806647!3d1.343949056391766!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2ssg!4v1731681854346!5m2!1sen!2ssg",
              },
              {
                type: "video",
                title: "Rick Astley - Never Gonna Give You Up",
                url: "https://www.youtube.com/embed/dQw4w9WgXcQ?si=ggGGn4uvFWAIelWD",
              },
            ],
            version: "0.1.0",
          },
          type: "Page",
          theme: "isomer-next",
          logoUrl: "",
          siteName: "MTI",
          isGovernment: true,
        }
      })
    },
    article: () => {
      // @ts-expect-error incomplete types
      return trpcMsw.page.readPageAndBlob.query(() => {
        return {
          title: "Article page",
          updatedAt: new Date("2024-09-12T07:00:00.000Z"),
          permalink: "article-layout",
          navbar: {
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
            },
          },
          footer: {
            id: 1,
            siteId: 1,
            content: {
              siteNavItems: [
                { url: "/about", title: "About us" },
                { url: "/partners", title: "Our partners" },
                {
                  url: "/grants-and-programmes",
                  title: "Grants and programmes",
                },
                { url: "/contact-us", title: "Contact us" },
                { url: "/something-else", title: "Something else" },
                { url: "/resources", title: "Resources" },
              ],
              contactUsLink: "/contact-us",
              termsOfUseLink: "/terms-of-use",
              feedbackFormLink: "https://www.form.gov.sg",
              privacyStatementLink: "/privacy",
            },
          },
          content: {
            page: {
              date: "11-09-2024",
              title: "article layout",
              category: "Feature Articles",
              articlePageHeader: { summary: "" },
            },
            layout: "article",
            content: [
              {
                type: "prose",
                content: [
                  {
                    type: "paragraph",
                    content: [{ text: "This is a prose block", type: "text" }],
                  },
                ],
              },
              {
                type: "prose",
                content: [
                  {
                    type: "paragraph",
                    content: [],
                  },
                ],
              },
              {
                type: "prose",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        text: "Thisisaproseblockthathasnospacesandshouldautomaticallytruncatetopreventoverflow",
                        type: "text",
                      },
                    ],
                  },
                ],
              },
              {
                type: "image",
                src: "https://placehold.co/600x400",
                alt: "This is an image",
              },
              {
                type: "callout",
                content: {
                  type: "prose",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        { text: "This is a callout block", type: "text" },
                      ],
                    },
                  ],
                },
              },
              {
                type: "callout",
                content: {
                  type: "prose",
                  content: [
                    {
                      type: "paragraph",
                      content: [],
                    },
                  ],
                },
              },
            ],
            version: "0.1.0",
          },
          type: "Page",
          theme: "isomer-next",
          logoUrl: "",
          siteName: "MTI",
          isGovernment: true,
        }
      })
    },
    index: () => {
      // @ts-expect-error incomplete types
      return trpcMsw.page.readPageAndBlob.query(() => {
        return {
          title: "Index page",
          updatedAt: new Date("2024-09-12T07:00:00.000Z"),
          permalink: "_index",
          navbar: {
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
          },
          footer: {
            id: 1,
            siteId: 1,
            content: {
              siteNavItems: [
                { url: "/about", title: "About us" },
                { url: "/partners", title: "Our partners" },
                {
                  url: "/grants-and-programmes",
                  title: "Grants and programmes",
                },
                { url: "/contact-us", title: "Contact us" },
                { url: "/something-else", title: "Something else" },
                { url: "/resources", title: "Resources" },
              ],
              contactUsLink: "/contact-us",
              termsOfUseLink: "/terms-of-use",
              feedbackFormLink: "https://www.form.gov.sg",
              privacyStatementLink: "/privacy",
            },
          },
          content: {
            page: {
              date: "11-09-2024",
              title: "article layout",
              category: "Feature Articles",
              articlePageHeader: { summary: "" },
            },
            layout: "index",
            content: [
              {
                type: "childpage",
                variant: "boxes",
                summary: false,
                thumbnail: false,
              },
            ],
            version: "0.1.0",
          },
          type: "IndexPage",
          theme: "isomer-next",
          logoUrl: "",
          siteName: "MTI",
          isGovernment: true,
        }
      })
    },
  },
  readPage: {
    homepage: (
      overrides: Partial<Awaited<ReturnType<typeof getPageById>>> = {},
    ) => {
      return trpcMsw.page.readPage.query(() => {
        return {
          id: "1",
          title: "Home",
          permalink: "",
          siteId: 1,
          parentId: null,
          publishedVersionId: null,
          draftBlobId: "1",
          type: "RootPage",
          state: "Draft",
          createdAt: new Date("2024-09-12T07:00:00.000Z"),
          updatedAt: new Date("2024-09-12T07:00:00.000Z"),
          ...overrides,
        }
      })
    },
    content: (
      overrides: Partial<Awaited<ReturnType<typeof getPageById>>> = {},
    ) => {
      return trpcMsw.page.readPage.query(() => {
        return {
          id: "3",
          title: "Page title here",
          permalink: "page-title-here",
          siteId: 1,
          parentId: null,
          publishedVersionId: null,
          draftBlobId: "2",
          type: "Page",
          state: "Draft",

          createdAt: new Date("2024-09-12T07:00:00.000Z"),
          updatedAt: new Date("2024-09-12T07:00:00.000Z"),
          ...overrides,
        }
      })
    },
    article: (
      overrides: Partial<Awaited<ReturnType<typeof getPageById>>> = {},
    ) => {
      return trpcMsw.page.readPage.query(() => {
        return {
          id: "4",
          title: "article layout",
          permalink: "article-layout",
          siteId: 1,
          parentId: null,
          publishedVersionId: null,
          draftBlobId: "3",
          type: "Page",
          state: "Draft",

          createdAt: new Date("2024-09-12T07:00:00.000Z"),
          updatedAt: new Date("2024-09-12T07:00:00.000Z"),
          ...overrides,
        }
      })
    },
    index: (
      overrides: Partial<Awaited<ReturnType<typeof getPageById>>> = {},
    ) => {
      return trpcMsw.page.readPage.query(() => {
        return {
          id: "4",
          title: "index layout",
          permalink: "_index",
          siteId: 1,
          parentId: "2",
          publishedVersionId: null,
          draftBlobId: "3",
          type: "IndexPage",
          state: "Draft",

          createdAt: new Date("2024-09-12T07:00:00.000Z"),
          updatedAt: new Date("2024-09-12T07:00:00.000Z"),
          ...overrides,
        }
      })
    },
  },
  getFullPermalink: {
    homepage: () =>
      trpcMsw.page.getFullPermalink.query(() => {
        return "/"
      }),
    content: () =>
      trpcMsw.page.getFullPermalink.query(() => {
        return "/page-title-here"
      }),
    article: () =>
      trpcMsw.page.getFullPermalink.query(() => {
        return "/article-layout"
      }),
    index: () =>
      trpcMsw.page.getFullPermalink.query(() => {
        return "parent"
      }),
  },
  getPermalinkTree: {
    root: () =>
      trpcMsw.page.getPermalinkTree.query(() => {
        return [""]
      }),
    withParent: () =>
      trpcMsw.page.getPermalinkTree.query(() => {
        return ["newsroom", "collection-page"]
      }),
    withGrandParent: () =>
      trpcMsw.page.getPermalinkTree.query(() => {
        return ["newsroom", "collection-page", "sub-collection-page"]
      }),
  },
}
