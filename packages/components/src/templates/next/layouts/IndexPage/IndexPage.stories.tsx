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

export const Default: Story = {
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
                summary: "Pages in Irrationality",
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
                summary: "Pages in Sibling",
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
      logoUrl: "/.storybook/assets/isomer-logo.svg",
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
    meta: {
      description: "A Next.js starter for Isomer",
    },
    page: {
      permalink: "/parent",
      title: "Index page",
      lastModified: "2024-05-02T14:12:57.160Z",
      contentPageHeader: {
        summary: "Pages in Index page",
      },
    },
    content: [],
  },
}

export const Custom: Story = {
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
                summary: "Pages in Irrationality",
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
                summary: "Pages in Sibling",
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
      logoUrl: "/.storybook/assets/isomer-logo.svg",
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
    meta: {
      description: "A Next.js starter for Isomer",
    },
    page: {
      permalink: "/parent",
      title: "Index page",
      lastModified: "2024-05-02T14:12:57.160Z",
      contentPageHeader: {
        summary: "Pages in Index page",
      },
    },
    content: [
      {
        type: "prose",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "This is a customisable index page in which content can be placed before the list of children.",
              },
            ],
          },
        ],
      },
    ],
  },
}
