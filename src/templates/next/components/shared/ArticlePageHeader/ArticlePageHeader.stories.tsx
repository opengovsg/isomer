import type { Meta, StoryFn } from "@storybook/react"
import type { ArticlePageHeaderProps } from "~/common"
import ArticlePageHeader from "./ArticlePageHeader"

export default {
  title: "Next/Internal Components/ArticlePageHeader",
  component: ArticlePageHeader,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<ArticlePageHeaderProps> = (args) => (
  <ArticlePageHeader {...args} />
)

export const Default = Template.bind({})
Default.args = {
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
}
