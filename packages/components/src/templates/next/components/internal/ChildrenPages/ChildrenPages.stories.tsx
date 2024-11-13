import type { Meta, StoryObj } from "@storybook/react"

import type { ChildrenPagesProps } from "~/interfaces"
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
      notification: {
        content: [{ type: "text", text: "This is a short notification" }],
      },
    },
    permalink: "/parent",
    LinkComponent: "a",
  },
}
