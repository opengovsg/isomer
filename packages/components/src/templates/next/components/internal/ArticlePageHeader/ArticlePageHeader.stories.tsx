import type { Meta, StoryObj } from "@storybook/react"

import type { ArticlePageHeaderProps } from "~/interfaces"
import ArticlePageHeader from "./ArticlePageHeader"

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

export const SingleSummaryItem: Story = {
  args: {
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
    category: "NParks Happenings",
    title:
      "Man sentenced to 24 months' imprisonment for smuggling 34.7 kg of rhinoceros horns",
    date: "1 May 2024",
    summary: [
      "20 pieces of rhinoceros horns were found in two pieces of transit baggage bound for Laos. The 34.7 kg seizure is the largest seizure of rhinoceros horns in Singapore to date.",
    ],
  },
}

export const MultipleSummaryItems: Story = {
  args: {
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
    category: "NParks Happenings",
    title:
      "Man sentenced to 24 months' imprisonment for smuggling 34.7 kg of rhinoceros horns",
    date: "1 May 2024",
    summary: [
      "20 pieces of rhinoceros horns were found in two pieces of transit baggage bound for Laos.",
      "The 34.7 kg seizure is the largest seizure of rhinoceros horns in Singapore to date.",
    ],
  },
}
