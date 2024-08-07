import type { Meta, StoryObj } from "@storybook/react"

import type { CollectionCardProps } from "~/interfaces"
import CollectionCard from "./CollectionCard"

const meta: Meta<CollectionCardProps> = {
  title: "Next/Internal Components/CollectionCard",
  component: CollectionCard,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof CollectionCard>

export const Default: Story = {
  args: {
    lastUpdated: "December 2, 2023",
    category: "Research",
    title:
      "A journal on microscopic plastic and their correlation to the number of staycations enjoyed per millennials between the ages of 30-42, substantiated by research from IDK university",
    url: "/",
    description:
      "We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year. We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year.",
    image: {
      src: "https://placehold.co/500x500",
      alt: "placeholder",
    },
    variant: "article",
  },
}

export const ArticleWithoutImage: Story = {
  args: {
    lastUpdated: "December 2, 2023",
    category: "Research",
    title:
      "A journal on microscopic plastic and their correlation to the number of staycations enjoyed per millennials between the ages of 30-42, substantiated by research from IDK university",
    url: "/",
    description:
      "We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year. We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year.",
    variant: "article",
  },
}

export const File: Story = {
  args: {
    lastUpdated: "December 2, 2023",
    category: "Research",
    title:
      "A journal on microscopic plastic and their correlation to the number of staycations enjoyed per millennials between the ages of 30-42, substantiated by research from IDK university",
    url: "/",
    description:
      "We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year. We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year.",
    image: {
      src: "https://placehold.co/500x500",
      alt: "placeholder",
    },
    variant: "file",
    fileDetails: {
      type: "pdf",
      size: "2.3 MB",
    },
  },
}

export const FileWithoutImage: Story = {
  args: {
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
  },
}
