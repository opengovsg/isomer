import type { Meta, StoryFn } from "@storybook/react"
import type { RelatedArticlesProps } from "~/common"
import RelatedArticles from "./RelatedArticles"

export default {
  title: "Next/Internal Components/RelatedArticles",
  component: RelatedArticles,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<RelatedArticlesProps> = (args) => (
  <RelatedArticles {...args} />
)

export const Default = Template.bind({})
Default.args = {
  items: [
    {
      title:
        "A Veterinary Council will be established to regulate standards and practices of veterinary professionals",
      url: "/items/first",
    },
    {
      title:
        "Wild boar escapes Singapore Zoo; captivated and returned to safety within 3 hours",
      url: "/items/second",
    },
    {
      title: "Mynah population decreasing YoY, a worrying trend",
      url: "/items/third",
    },
  ],
}
