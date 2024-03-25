import { Meta, StoryFn } from "@storybook/react"
import CollectionCard from "./CollectionCard"
import { CollectionCardProps } from "~/common"

export default {
  title: "Next/Components/CollectionCard",
  component: CollectionCard,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<CollectionCardProps> = (args) => (
  <CollectionCard {...args} />
)

export const Default = Template.bind({})
Default.args = {
  lastUpdated: "December 2, 2023",
  category: "Research",
  title:
    "A journal on microscopic plastic and their correlation to the number of staycations enjoyed per millennials between the ages of 30-42, substantiated by research from IDK university",
  url: "/",
  description:
    "We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year. We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year.",
  image: {
    src: "https://picsum.photos/500/500",
    alt: "placeholder",
  },
  variant: "article",
}

export const ArticleWithoutImage = Template.bind({})
ArticleWithoutImage.args = {
  lastUpdated: "December 2, 2023",
  category: "Research",
  title:
    "A journal on microscopic plastic and their correlation to the number of staycations enjoyed per millennials between the ages of 30-42, substantiated by research from IDK university",
  url: "/",
  description:
    "We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year. We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year.",
  variant: "article",
}

export const File = Template.bind({})
File.args = {
  lastUpdated: "December 2, 2023",
  category: "Research",
  title:
    "A journal on microscopic plastic and their correlation to the number of staycations enjoyed per millennials between the ages of 30-42, substantiated by research from IDK university",
  url: "/",
  description:
    "We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year. We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year.",
  image: {
    src: "https://picsum.photos/1000/1000",
    alt: "placeholder",
  },
  variant: "file",
  fileDetails: {
    type: "pdf",
    size: "2.3 MB",
  },
}

export const FileWithoutImage = Template.bind({})
FileWithoutImage.args = {
  lastUpdated: "December 2, 2023",
  category: "Research",
  title:
    "A journal on microscopic plastic and their correlation to the number of staycations enjoyed per millennials between the ages of 30-42, substantiated by research from IDK university",
  url: "/",
  description:
    "We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year. We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year.",
  variant: "file",
  fileDetails: {
    type: "pdf",
    size: "2.3 MB",
  },
}
