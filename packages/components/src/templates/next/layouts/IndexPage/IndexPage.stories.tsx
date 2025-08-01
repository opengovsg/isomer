import type { Meta, StoryObj } from "@storybook/react"

import { withChromaticModes } from "@isomer/storybook-config"

import type { IndexPageSchemaType } from "~/types"
import IndexPage from "./IndexPage"
import { generateSiteConfig } from ".storybook/helpers"

const DEFAULT_INDEX_PAGE = {
  permalink: "/parent",
  title: "Index page",
  lastModified: "2024-05-02T14:12:57.160Z",
  contentPageHeader: {
    showThumbnail: false,
    summary: "Pages in Index page",
  },
}

const generateIndexPage = (
  page: IndexPageSchemaType["page"],
  overrides?: Partial<IndexPageSchemaType>,
): Partial<IndexPageSchemaType> => {
  return {
    layout: "index",
    site: generateSiteConfig({
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
                image: {
                  src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqBmkS5UiA-cppkrliK5R5csepf8jJ4BfMcQ&s",
                  alt: "funny cat",
                },
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
              {
                id: "5",
                title: "Steven Pinker's Rationality",
                permalink: "/parent/child-page-2",
                lastModified: "",
                layout: "content",
                summary: "",
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
    }),
    meta: {
      description: "A Next.js starter for Isomer",
    },
    page,
    content: [],
    ...overrides,
  }
}

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
  args: generateIndexPage(DEFAULT_INDEX_PAGE),
}

export const WithButton = {
  args: generateIndexPage({
    ...DEFAULT_INDEX_PAGE,
    contentPageHeader: {
      ...DEFAULT_INDEX_PAGE.contentPageHeader,
      buttonLabel: "Button",
      buttonUrl: "www.google.com",
    },
  }),
}

export const Custom: Story = {
  args: generateIndexPage(
    {
      ...DEFAULT_INDEX_PAGE,
      contentPageHeader: {
        showThumbnail: false,
        summary: "Pages in Index page",
      },
    },
    {
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
  ),
}

export const Rows: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        type: "childrenpages",
        variant: "rows",
        showSummary: false,
        showThumbnail: false,
        childrenPagesOrdering: [],
      },
    ],
  }),
}

export const RowsWithImageOnly: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        childrenPagesOrdering: [],
        type: "childrenpages",
        variant: "rows",
        showSummary: false,
        showThumbnail: true,
      },
    ],
  }),
}

export const RowsWithDescriptionOnly: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        childrenPagesOrdering: [],
        type: "childrenpages",
        variant: "rows",
        showSummary: true,
        showThumbnail: false,
      },
    ],
  }),
}

export const RowsWithImageAndDescription: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        childrenPagesOrdering: [],
        type: "childrenpages",
        variant: "rows",
        showSummary: true,
        showThumbnail: true,
      },
    ],
  }),
}

export const RowsWithImageAndDescriptionAndContent: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        type: "prose",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [
              {
                type: "text",
                text: "This is a customisable index page in which content can be placed before the list of children.",
              },
            ],
          },
        ],
      },
      {
        childrenPagesOrdering: [],
        type: "childrenpages",
        variant: "rows",
        showSummary: true,
        showThumbnail: true,
      },
    ],
  }),
}

export const Boxes: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        childrenPagesOrdering: [],
        type: "childrenpages",
        variant: "boxes",
        showSummary: false,
        showThumbnail: false,
      },
    ],
  }),
}

export const BoxesWithImageOnly: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        childrenPagesOrdering: [],
        type: "childrenpages",
        variant: "boxes",
        showSummary: false,
        showThumbnail: true,
      },
    ],
  }),
}

export const BoxesWithDescriptionOnly: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        childrenPagesOrdering: [],
        type: "childrenpages",
        variant: "boxes",
        showSummary: true,
        showThumbnail: false,
      },
    ],
  }),
}

export const BoxesWithImageAndDescription: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        childrenPagesOrdering: [],
        type: "childrenpages",
        variant: "boxes",
        showSummary: true,
        showThumbnail: true,
      },
    ],
  }),
}

export const BoxesWithImageAndDescriptionAndContent: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        type: "prose",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [
              {
                type: "text",
                text: "This is a customisable index page in which content can be placed before the list of children.",
              },
            ],
          },
        ],
      },
      {
        childrenPagesOrdering: [],
        type: "childrenpages",
        variant: "boxes",
        showSummary: true,
        showThumbnail: true,
      },
    ],
  }),
}
