import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ArticlePageHeaderProps } from "~/interfaces"

import { ArticlePageHeader } from "./ArticlePageHeader"

const meta: Meta<ArticlePageHeaderProps> = {
  title: "Next/Internal Components/ArticlePageHeader",
  component: ArticlePageHeader,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof ArticlePageHeader>

const ARTICLE = {
  breadcrumb: {
    links: [
      {
        title: "Newsroom",
        url: "/newsroom",
      },
      {
        title: "News",
        url: "/newsroom/news",
      },
      {
        title:
          "Man sentenced to 24 months' imprisonment for smuggling 34.7 kg of rhinoceros horns",
        url: "/newsroom/news/man-sentenced-to-24-months-imprisonment-for-smuggling-34-7-kg-of-rhinoceros-horns",
      },
    ],
  },
  plaintextTags: [{ category: "Category", selected: ["NParks Happenings"] }],
  title:
    "Man sentenced to 24 months' imprisonment for smuggling 34.7 kg of rhinoceros horns",
  date: "1 May 2024",
  summary:
    "20 pieces of rhinoceros horns were found in two pieces of transit baggage bound for Laos. The 34.7 kg seizure is the largest seizure of rhinoceros horns in Singapore to date.",
}

export const SingleSummaryItem: Story = {
  args: ARTICLE,
}

export const WithoutCategory: Story = {
  args: {
    ...ARTICLE,
    plaintextTags: [],
  },
}

export const MultiplePlaintextGroups: Story = {
  args: {
    ...ARTICLE,
    plaintextTags: [
      { category: "Category", selected: ["NParks Happenings"] },
      { category: "Region", selected: ["Wildlife"] },
    ],
  },
}

export const ArticleWithTags: Story = {
  args: {
    ...ARTICLE,
    // NOTE: `pillTags` here is expected to already exclude any
    // `display: "plaintext"` groups (see Article.tsx's `pillTags`), so
    // that they aren't duplicated as a pill.
    pillTags: [
      {
        category: "Tags",
        selected: ["NParks Happenings", "Wild dinosaur"],
      },
    ],
  },
}
