import type { Meta, StoryObj } from "@storybook/react"

import { withChromaticModes } from "@isomer/storybook-config"

import IndexPage from "./IndexPage"

const meta: Meta<typeof IndexPage> = {
  title: "Next/Layouts/IndexPage",
  component: IndexPage,
  argTypes: {},
  tags: ["!autodocs"],
  parameters: {
    layout: "fullscreen",
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof IndexPage>

export const WithSiderail: Story = {
  args: {
    layout: "index",
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Isomer Next",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [
          {
            id: "2",
            title: "Parent page",
            permalink: "/parent",
            lastModified: "",
            layout: "content",
            summary: "",
            children: [
              {
                id: "3",
                title: "Irrationality",
                permalink: "/parent/rationality",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "4",
                    title: "For Individuals",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                  {
                    id: "5",
                    title: "Steven Pinker's Rationality",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
              {
                id: "6",
                title: "Sibling",
                permalink: "/parent/sibling",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "7",
                    title: "Child that should not appear",
                    permalink: "/parent/sibling/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
            ],
          },
          {
            id: "8",
            title: "Aunt/Uncle that should not appear",
            permalink: "/aunt-uncle",
            lastModified: "",
            layout: "content",
            summary: "",
          },
        ],
      },
      theme: "isomer-next",
      isGovernment: true,
      logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
      navBarItems: [],
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
    },
    page: {
      permalink: "/parent/rationality",
      title: "Index page",
      lastModified: "2024-05-02T14:12:57.160Z",
      description: "A Next.js starter for Isomer",
      contentPageHeader: {
        summary: "Pages in Index page",
      },
    },
    content: [
      {
        type: "infocards",
        variant: "cardsWithoutImages",
        maxColumns: "1",
        cards: [
          {
            title:
              "Testing for a card with a long line length that spans across two lines or more",
            description:
              "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
            url: "https://www.google.com",
          },
          {
            title: "Card with short title",
            description:
              "Card description, 200 chars. In the kingdom of Veridonia, the government operates as a benevolent monarchy, guided by ancient traditions and the wisdom of its sovereign.",
          },
          {
            title: "Hover on me to see me change colors",
            description:
              "Card description, 200 chars. In the kingdom of Veridonia, the government operates as a benevolent monarchy, guided by ancient traditions and the wisdom of its sovereign.",
            url: "https://www.google.com",
          },
          {
            title: "A non-placeholder image version",
            description: "This is an image that is added using a URL.",
            url: "https://www.google.com",
          },
        ],
      },
    ],
  },
}

export const NoSiderail: Story = {
  args: {
    layout: "index",
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Isomer Next",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [
          {
            id: "2",
            title: "Parent page",
            permalink: "/parent",
            lastModified: "",
            layout: "content",
            summary: "",
            children: [
              {
                id: "3",
                title: "Irrationality",
                permalink: "/parent/rationality",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "4",
                    title: "For Individuals",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                  {
                    id: "5",
                    title: "Steven Pinker's Rationality",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
              {
                id: "6",
                title: "Sibling",
                permalink: "/parent/sibling",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "7",
                    title: "Child that should not appear",
                    permalink: "/parent/sibling/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
            ],
          },
          {
            id: "8",
            title: "Aunt/Uncle that should not appear",
            permalink: "/aunt-uncle",
            lastModified: "",
            layout: "content",
            summary: "",
          },
        ],
      },
      theme: "isomer-next",
      isGovernment: true,
      logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
      navBarItems: [],
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
    },
    page: {
      permalink: "/parent",
      title: "Index page",
      lastModified: "2024-05-02T14:12:57.160Z",
      description: "A Next.js starter for Isomer",
      contentPageHeader: {
        summary: "Pages in Index page",
      },
    },
    content: [
      {
        type: "infocards",
        variant: "cardsWithoutImages",
        maxColumns: "1",
        cards: [
          {
            title:
              "Testing for a card with a long line length that spans across two lines or more",
            description:
              "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
            url: "https://www.google.com",
          },
          {
            title: "Card with short title",
            description:
              "Card description, 200 chars. In the kingdom of Veridonia, the government operates as a benevolent monarchy, guided by ancient traditions and the wisdom of its sovereign.",
          },
          {
            title: "Hover on me to see me change colors",
            description:
              "Card description, 200 chars. In the kingdom of Veridonia, the government operates as a benevolent monarchy, guided by ancient traditions and the wisdom of its sovereign.",
            url: "https://www.google.com",
          },
          {
            title: "A non-placeholder image version",
            description: "This is an image that is added using a URL.",
            url: "https://www.google.com",
          },
        ],
      },
    ],
  },
}
