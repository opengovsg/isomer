import type { Meta, StoryObj } from "@storybook/react"

import type { ChildrenPagesProps } from "~/interfaces"
import type { IsomerSiteProps } from "~/types"
import ChildrenPages from "./ChildrenPages"

const meta: Meta<ChildrenPagesProps> = {
  title: "Next/Internal Components/ChildrenPages",
  component: ChildrenPages,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof ChildrenPages>

const site: IsomerSiteProps = {
  siteName: "Isomer Next",
  siteMap: {
    id: "1",
    title: "Isomer Next",
    permalink: "/",
    lastModified: "",
    layout: "homepage",
    summary: "This is some page summary.",
    children: [
      {
        id: "2",
        title:
          "Parent page with a very long title that will likely cause an overflow",
        permalink: "/parent",
        lastModified: "",
        layout: "content",
        summary: "This is some page summary.",
        children: [
          {
            id: "3",
            title:
              "Irrationality this should have a long long long long long long long title that wraps to the max width of the content header, and its' breadcrumb truncates, but ideally should not be this long",
            permalink: "/parent/rationality",
            lastModified: "",
            layout: "content",
            summary: "This is some page summary.",
            image: {
              src: "data:image/jpeg;base64,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",
              alt: "this is one cute cat",
            },
            children: [
              {
                id: "4",
                title: "For Individuals",
                permalink: "/parent/rationality/child-page-2",
                lastModified: "",
                layout: "content",
                summary: "This is some page summary.",
              },
              {
                id: "5",
                title: "Steven Pinker's Rationality",
                permalink: "/parent/rationality/child-page-2",
                lastModified: "",
                layout: "content",
                summary: "This is some page summary.",
              },
            ],
          },
          {
            id: "6",
            title:
              "Sibling with a long title that will likely cause an overflow",
            permalink: "/parent/sibling",
            lastModified: "",
            layout: "content",
            summary: "This is some page summary.",
            image: {
              src: "https://www.google.com/imgres?q=cat%20picture&imgurl=https%3A%2F%2Fi.pinimg.com%2F236x%2Fc6%2F2e%2F47%2Fc62e47ccce4e8e568c9c7e381032bde9.jpg&imgrefurl=https%3A%2F%2Fin.pinterest.com%2Fshahenazmalek6464%2Fcute-cat%2F&docid=uTE0JJ2tHq8PFM&tbnid=8YniKDWhiEGvQM&vet=12ahUKEwiSyNCL-fCMAxVpzDgGHZnXLdgQM3oECHAQAA..i&w=236&h=420&hcb=2&ved=2ahUKEwiSyNCL-fCMAxVpzDgGHZnXLdgQM3oECHAQAA",
              alt: "this is quite a pretty cat",
            },
            children: [
              {
                id: "7",
                title: "Child that should not appear",
                permalink: "/parent/sibling/child-page-2",
                lastModified: "",
                layout: "content",
                summary: "This is some page summary.",
              },
            ],
          },
          {
            id: "8",
            title:
              "IrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationality",
            permalink: "/parent/rationality2",
            lastModified: "",
            layout: "content",
            summary: "This is some page summary.",
            image: {
              src: "data:image/jpeg;base64,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",
              alt: "much hunter, so wow",
            },
            children: [
              {
                id: "9",
                title: "For Individuals",
                permalink: "/parent/rationality/child-page-2",
                lastModified: "",
                layout: "content",
                summary: "This is some page summary.",
              },
              {
                id: "10",
                title: "Steven Pinker's Rationality",
                permalink: "/parent/rationality/child-page-2",
                lastModified: "",
                layout: "content",
                summary: "This is some page summary.",
              },
            ],
          },
          {
            id: "11",
            title: "Sibling",
            permalink: "/parent/sibling",
            lastModified: "",
            layout: "content",
            summary: "This is some page summary.",
            image: {
              src: "data:image/jpeg;base64,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",
              alt: "very fit, such a long boy",
            },
            children: [
              {
                id: "12",
                title: "Child that should not appear",
                permalink: "/parent/sibling/child-page-2",
                lastModified: "",
                layout: "content",
                summary: "This is some page summary.",
              },
            ],
          },
          {
            id: "13",
            title: "Irrationality3",
            permalink: "/parent/rationality3",
            lastModified: "",
            layout: "content",
            summary: "This is some page summary.",
            children: [
              {
                id: "14",
                title: "For Individuals",
                permalink: "/parent/rationality/child-page-2",
                lastModified: "",
                layout: "content",
                summary: "This is some page summary.",
              },
              {
                id: "15",
                title: "Steven Pinker's Rationality",
                permalink: "/parent/rationality/child-page-2",
                lastModified: "",
                layout: "content",
                summary: "This is some page summary.",
              },
            ],
          },
          {
            id: "16",
            title: "Sibling",
            permalink: "/parent/sibling",
            lastModified: "",
            layout: "content",
            summary: "This is some page summary.",
            children: [
              {
                id: "17",
                title: "Child that should not appear",
                permalink: "/parent/sibling/child-page-2",
                lastModified: "",
                layout: "content",
                summary: "This is some page summary.",
              },
            ],
          },
          {
            id: "18",
            title: "Irrationality4",
            permalink: "/parent/rationality4",
            lastModified: "",
            layout: "content",
            summary: "This is some page summary.",
            children: [
              {
                id: "19",
                title: "For Individuals",
                permalink: "/parent/rationality/child-page-2",
                lastModified: "",
                layout: "content",
                summary: "This is some page summary.",
              },
              {
                id: "20",
                title: "Steven Pinker's Rationality",
                permalink: "/parent/rationality/child-page-2",
                lastModified: "",
                layout: "content",
                summary: "This is some page summary.",
              },
            ],
          },
          {
            id: "21",
            title: "Sibling",
            permalink: "/parent/sibling",
            lastModified: "",
            layout: "content",
            summary: "This is some page summary.",
            children: [
              {
                id: "22",
                title: "Child that should not appear",
                permalink: "/parent/sibling/child-page-2",
                lastModified: "",
                layout: "content",
                summary: "This is some page summary.",
              },
            ],
          },
          {
            id: "23",
            title: "Irrationality5",
            permalink: "/parent/rationality5",
            lastModified: "",
            layout: "content",
            summary: "This is some page summary.",
            children: [
              {
                id: "24",
                title: "For Individuals",
                permalink: "/parent/rationality/child-page-2",
                lastModified: "",
                layout: "content",
                summary: "This is some page summary.",
              },
              {
                id: "25",
                title: "Steven Pinker's Rationality",
                permalink: "/parent/rationality/child-page-2",
                lastModified: "",
                layout: "content",
                summary: "This is some page summary.",
              },
            ],
          },
          {
            id: "26",
            title: "Sibling",
            permalink: "/parent/sibling",
            lastModified: "",
            layout: "content",
            summary: "This is some page summary.",
            children: [
              {
                id: "27",
                title: "Child that should not appear",
                permalink: "/parent/sibling/child-page-2",
                lastModified: "",
                layout: "content",
                summary: "This is some page summary.",
              },
            ],
          },
          {
            id: "28",
            title: "Irrationality6",
            permalink: "/parent/rationality6",
            lastModified: "",
            layout: "content",
            summary: "This is some page summary.",
            children: [
              {
                id: "29",
                title: "For Individuals",
                permalink: "/parent/rationality/child-page-2",
                lastModified: "",
                layout: "content",
                summary: "This is some page summary.",
              },
              {
                id: "30",
                title: "Steven Pinker's Rationality",
                permalink: "/parent/rationality/child-page-2",
                lastModified: "",
                layout: "content",
                summary: "This is some page summary.",
              },
            ],
          },
          {
            id: "31",
            title: "Sibling",
            permalink: "/parent/sibling",
            lastModified: "",
            layout: "content",
            summary: "This is some page summary.",
            children: [
              {
                id: "32",
                title: "Child that should not appear",
                permalink: "/parent/sibling/child-page-2",
                lastModified: "",
                layout: "content",
                summary: "This is some page summary.",
              },
            ],
          },
        ],
      },
      {
        id: "33",
        title: "Aunt/Uncle that should not appear",
        permalink: "/aunt-uncle",
        lastModified: "",
        layout: "content",
        summary: "This is some page summary.",
      },
    ],
  },
  theme: "isomer-next",
  isGovernment: true,
  logoUrl: "/isomer-logo.svg",
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
  notification: {
    content: [{ type: "text", text: "This is a short notification" }],
  },
}

export const Default: Story = {
  args: {
    permalink: "/parent",
    LinkComponent: "a",
    site,
  },
}

export const BaseRows: Story = {
  args: {
    layout: "rows",
    site,
    permalink: "/parent",
    LinkComponent: "a",
  },
}

export const RowsWithDescription: Story = {
  args: {
    layout: "rows",
    site,
    permalink: "/parent",
    LinkComponent: "a",
    showSummary: true,
  },
}

export const RowsWithThumbnailOnly: Story = {
  args: {
    layout: "rows",
    site,
    permalink: "/parent",
    LinkComponent: "a",
    showThumbnail: true,
  },
}

export const RowsWithThumbnailAndDescription: Story = {
  args: {
    layout: "rows",
    site,
    permalink: "/parent",
    LinkComponent: "a",
    showSummary: true,
    showThumbnail: true,
  },
}

export const Boxes: Story = {
  args: {
    layout: "boxes",
    site,
    permalink: "/parent",
    LinkComponent: "a",
  },
}

export const BoxesWithDescription: Story = {
  args: {
    layout: "boxes",
    site,
    permalink: "/parent",
    LinkComponent: "a",
    showSummary: true,
  },
}

export const BoxesWithThumbnailOnly: Story = {
  args: {
    layout: "boxes",
    site,
    permalink: "/parent",
    LinkComponent: "a",
    showThumbnail: true,
  },
}
export const BoxesWithThumbnailAndDescription: Story = {
  args: {
    layout: "boxes",
    site,
    permalink: "/parent",
    LinkComponent: "a",
    showSummary: true,
    showThumbnail: true,
  },
}
