import type { Meta, StoryObj } from "@storybook/react"

import type { CollectionBlockProps } from "~/interfaces"
import type { IsomerSitemap } from "~/types/sitemap"
import { CollectionBlock } from "./CollectionBlock"
import { generateSiteConfig } from ".storybook/helpers"

const meta: Meta<CollectionBlockProps> = {
  title: "Next/Components/CollectionBlock",
  component: CollectionBlock,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}

export default meta
type Story = StoryObj<typeof CollectionBlock>

const generateArgs = ({
  collectionReferenceLink = "[resource:1:2]",
  displayThumbnail,
  displayCategory,
  withImageFallback = false,
  buttonLabel = "View all corrections",
  isDateless = false,
  numberOfCards = 3,
}: Partial<
  Omit<CollectionBlockProps, "site"> & {
    isDateless?: boolean
    numberOfCards?: number
    withImageFallback?: boolean
  }
>): Partial<CollectionBlockProps> => {
  const cards: IsomerSitemap[] = [
    {
      id: "3",
      title:
        "Date of Government Gazette Notification on Dissolution of Parliament",
      category: "yes i am a category",
      permalink: "/collection-1/item-1",
      layout: "article",
      summary: "",
      date: isDateless ? undefined : "2021-01-03",
      lastModified: isDateless ? "" : new Date("2021-01-03").toISOString(),
      children: [],
      ...(withImageFallback
        ? {}
        : {
            image: {
              src: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=3715&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              alt: "Image 1",
            },
          }),
    },
    {
      id: "4",
      title: "Impact of Foreign Professionals on our Economy and Society",
      category: "yes i am a category",
      permalink: "/collection-1/item-2",
      layout: "article",
      summary: "",
      date: isDateless ? undefined : "2021-01-02",
      lastModified: isDateless ? "" : new Date("2021-01-02").toISOString(),
      children: [],
      image: {
        src: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=3024&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        alt: "Image 2",
      },
    },
    {
      id: "5",
      title: "Where does Government revenue come from?",
      category: "yes i am a category",
      permalink: "/collection-1/item-3",
      layout: "article",
      summary: "",
      date: isDateless ? undefined : "2021-01-01",
      lastModified: isDateless ? "" : new Date("2021-01-01").toISOString(),
      children: [],
      image: {
        src: "https://images.unsplash.com/photo-1511044568932-338cba0ad803?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        alt: "Image 3",
      },
    },
  ]

  return {
    type: "collectionblock",
    collectionReferenceLink,
    displayThumbnail,
    displayCategory,
    buttonLabel,
    site: generateSiteConfig({
      siteMap: {
        id: "1",
        title: "Home",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [
          {
            id: "2",
            title: "Corrections and Clarifications",
            permalink: "/collection-1",
            layout: "collection",
            summary:
              "Clarifying widespread or common misperceptions of Government policy, or inaccurate assertions on matters of public concern that can harm Singapore's social fabric.",
            lastModified: "2021-01-01",
            children: cards.slice(0, numberOfCards),
          },
        ],
      },
    }),
  }
}

export const WithImage: Story = {
  name: "With Image",
  args: generateArgs({ displayThumbnail: true, displayCategory: true }),
}

export const WithImageFallback: Story = {
  name: "With Image Fallback",
  args: generateArgs({
    displayThumbnail: true,
    displayCategory: true,
    withImageFallback: true,
  }),
}

export const WithoutImage: Story = {
  name: "Without Image",
  args: generateArgs({ displayThumbnail: false, displayCategory: true }),
}

export const WithoutCategory: Story = {
  name: "Without Category",
  args: generateArgs({ displayThumbnail: true, displayCategory: false }),
}

export const DatelessVariant: Story = {
  name: "Dateless Variant",
  args: generateArgs({
    displayThumbnail: true,
    displayCategory: true,
    isDateless: true,
  }),
}

export const OneCard: Story = {
  name: "One Card",
  args: generateArgs({
    displayThumbnail: true,
    displayCategory: true,
    numberOfCards: 1,
  }),
}

export const TwoCards: Story = {
  name: "Two Cards",
  args: generateArgs({
    displayThumbnail: true,
    displayCategory: true,
    numberOfCards: 2,
  }),
}
