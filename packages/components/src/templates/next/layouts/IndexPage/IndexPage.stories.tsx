import type { Meta, StoryObj } from "@storybook/react-vite"
import type { IndexPageSchemaType } from "~/types"
import { generateSiteConfig } from "~/stories/helpers"

import { withChromaticModes } from "@isomer/storybook-config"

import { IndexPageLayout } from "./IndexPage"

const DEFAULT_INDEX_PAGE = {
  contentPageHeader: {
    showThumbnail: false,
    summary: "Pages in Index page",
  },
  lastModified: "2024-05-02T14:12:57.160Z",
  permalink: "/parent",
  title: "Index page",
}

const generateIndexPage = (
  page: IndexPageSchemaType["page"],
  overrides?: Partial<IndexPageSchemaType>,
): Partial<IndexPageSchemaType> => (
  {
    content: [],
    layout: "index",
    meta: {
      description: "A Next.js starter for Isomer",
    },
    page,
    site: generateSiteConfig({
      siteMap: {
        children: [
          {
            children: [
              {
                children: [
                  {
                    id: "4",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "For Individuals",
                  },
                  {
                    id: "5",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/rationality/child-page-2",
                    summary: "",
                    title: "Steven Pinker's Rationality",
                  },
                ],
                id: "3",
                lastModified: "",
                layout: "content",
                permalink: "/parent/rationality",
                summary: "Pages in Irrationality",
                title: "Irrationality",
              },
              {
                children: [
                  {
                    id: "7",
                    lastModified: "",
                    layout: "content",
                    permalink: "/parent/sibling/child-page-2",
                    summary: "",
                    title: "Child that should not appear",
                  },
                ],
                id: "6",
                image: {
                  alt: "funny cat",
                  src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqBmkS5UiA-cppkrliK5R5csepf8jJ4BfMcQ&s",
                },
                lastModified: "",
                layout: "content",
                permalink: "/parent/sibling",
                summary: "Pages in Sibling",
                title: "Sibling",
              },
              {
                id: "5",
                lastModified: "",
                layout: "content",
                permalink: "/parent/child-page-2",
                summary: "",
                title: "Steven Pinker's Rationality",
              },
              {
                id: "9",
                image: {
                  alt: "Thumbnail for Database page with thumbnail",
                  src: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop",
                },
                lastModified: "",
                layout: "database",
                permalink: "/parent/database-page-with-thumbnail",
                summary: "Database page with thumbnail",
                title: "Database page with thumbnail",
              },
              {
                id: "10",
                lastModified: "",
                layout: "database",
                permalink: "/parent/database-page-without-thumbnail",
                summary: "Database page without thumbnail",
                title: "Database page without thumbnail",
              },
            ],
            id: "2",
            lastModified: "",
            layout: "content",
            permalink: "/parent",
            summary: "",
            title: "Parent page",
          },
          {
            id: "8",
            lastModified: "",
            layout: "content",
            permalink: "/aunt-uncle",
            summary: "",
            title: "Aunt/Uncle that should not appear",
          },
        ],
        id: "1",
        lastModified: "",
        layout: "homepage",
        permalink: "/",
        summary: "",
        title: "Isomer Next",
      },
    }),
    ...overrides,
  }
)

const meta: Meta<typeof IndexPageLayout> = {
  argTypes: {},
  component: IndexPageLayout,
  parameters: {
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  tags: ["!autodocs"],
  title: "Next/Layouts/IndexPage",
}
export default meta
type Story = StoryObj<typeof IndexPageLayout>

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
          content: [
            {
              content: [
                {
                  text: "This is a customisable index page in which content can be placed before the list of children.",
                  type: "text",
                },
              ],
              type: "paragraph",
            },
          ],
          type: "prose",
        },
      ],
    },
  ),
}

export const WithTableOfContents: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        content: [
          {
            attrs: { level: 2 },
            content: [{ text: "First Section", type: "text" }],
            type: "heading",
          },
          {
            content: [{ text: "Content for the first section.", type: "text" }],
            type: "paragraph",
          },
          {
            attrs: { level: 2 },
            content: [{ text: "Second Section", type: "text" }],
            type: "heading",
          },
          {
            content: [
              { text: "Content for the second section.", type: "text" },
            ],
            type: "paragraph",
          },
        ],
        type: "prose",
      },
    ],
  }),
}

export const Rows: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        childrenPagesOrdering: [],
        showSummary: false,
        showThumbnail: false,
        type: "childrenpages",
        variant: "rows",
      },
    ],
  }),
}

export const RowsWithImageOnly: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        childrenPagesOrdering: [],
        showSummary: false,
        showThumbnail: true,
        type: "childrenpages",
        variant: "rows",
      },
    ],
  }),
}

export const RowsWithDescriptionOnly: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        childrenPagesOrdering: [],
        showSummary: true,
        showThumbnail: false,
        type: "childrenpages",
        variant: "rows",
      },
    ],
  }),
}

export const RowsWithImageAndDescription: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        childrenPagesOrdering: [],
        showSummary: true,
        showThumbnail: true,
        type: "childrenpages",
        variant: "rows",
      },
    ],
  }),
}
export const RowsWithContainAndImageAndDescription: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        childrenPagesOrdering: [],
        imageFit: "contain",
        showSummary: true,
        showThumbnail: true,
        type: "childrenpages",
        variant: "rows",
      },
    ],
  }),
}

export const RowsWithImageAndDescriptionAndContent: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        content: [
          {
            attrs: { level: 2 },
            content: [
              {
                text: "This is a customisable index page in which content can be placed before the list of children.",
                type: "text",
              },
            ],
            type: "heading",
          },
        ],
        type: "prose",
      },
      {
        childrenPagesOrdering: [],
        showSummary: true,
        showThumbnail: true,
        type: "childrenpages",
        variant: "rows",
      },
    ],
  }),
}

export const Boxes: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        childrenPagesOrdering: [],
        showSummary: false,
        showThumbnail: false,
        type: "childrenpages",
        variant: "boxes",
      },
    ],
  }),
}

export const BoxesWithImageOnly: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        childrenPagesOrdering: [],
        showSummary: false,
        showThumbnail: true,
        type: "childrenpages",
        variant: "boxes",
      },
    ],
  }),
}

export const BoxesWithDescriptionOnly: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        childrenPagesOrdering: [],
        showSummary: true,
        showThumbnail: false,
        type: "childrenpages",
        variant: "boxes",
      },
    ],
  }),
}

export const BoxesWithImageAndDescription: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        childrenPagesOrdering: [],
        showSummary: true,
        showThumbnail: true,
        type: "childrenpages",
        variant: "boxes",
      },
    ],
  }),
}

export const BoxesWithContainAndImageAndDescription: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        childrenPagesOrdering: [],
        imageFit: "contain",
        showSummary: true,
        showThumbnail: true,
        type: "childrenpages",
        variant: "boxes",
      },
    ],
  }),
}

export const BoxesWithCustomOrdering: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        childrenPagesOrdering: ["6", "3", "5"],
        showSummary: true,
        showThumbnail: true,
        type: "childrenpages",
        variant: "boxes",
      },
    ],
  }),
}

export const BoxesWithImageAndDescriptionAndContent: Story = {
  args: generateIndexPage(DEFAULT_INDEX_PAGE, {
    content: [
      {
        content: [
          {
            attrs: { level: 2 },
            content: [
              {
                text: "This is a customisable index page in which content can be placed before the list of children.",
                type: "text",
              },
            ],
            type: "heading",
          },
        ],
        type: "prose",
      },
      {
        childrenPagesOrdering: [],
        showSummary: true,
        showThumbnail: true,
        type: "childrenpages",
        variant: "boxes",
      },
    ],
  }),
}
