import type { DelayMode } from "msw"
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
            page: { title: "Home" },
            layout: "homepage",
            content: [
              {
                type: "hero",
                title: "Ministry of Trade and Industry",
                variant: "gradient",
                subtitle:
                  "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
                buttonUrl: "/",
                buttonLabel: "Main CTA",
                backgroundUrl:
                  "https://ohno.isomer.gov.sg/images/hero-banner.png",
                secondaryButtonUrl: "/",
                secondaryButtonLabel: "Sub CTA",
              },
              {
                type: "infopic",
                title: "This is an infopic",
                imageSrc: "https://placehold.co/600x400",
                description:
                  "This is the description for the infopic component",
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
              articlePageHeader: { summary: [] },
            },
            layout: "article",
            content: [],
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
