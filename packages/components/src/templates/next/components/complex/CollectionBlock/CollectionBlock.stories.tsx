import type { Meta, StoryObj } from "@storybook/react-vite"
import type { CollectionBlockProps } from "~/interfaces"
import type {
  IsomerCollectionPageSitemap,
  IsomerSitemap,
} from "~/types/sitemap"
import { generateSiteConfig } from "~/stories/helpers"
import { TAG_CATEGORY_DISPLAY_OPTIONS } from "~/types/constants"

import { CollectionBlock } from "./CollectionBlock"

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

type TagCategories = NonNullable<
  IsomerCollectionPageSitemap["collectionPagePageProps"]
>["tagCategories"]

// Category is now an ordinary tagCategories group — the option a card is
// tagged with is what CollectionBlock displays under its title.
const DEFAULT_CATEGORY_OPTION_ID = "category-option-yes-i-am-a-category"
const DEFAULT_TAG_CATEGORIES: TagCategories = [
  {
    label: "Category",
    id: "category-group",
    isRequired: true,
    display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
    options: [{ label: "yes i am a category", id: DEFAULT_CATEGORY_OPTION_ID }],
  },
]

const generateArgs = ({
  collectionReferenceLink = "[resource:1:2]",
  displayThumbnail,
  displayCategory,
  withImageFallback = false,
  buttonLabel = "View all corrections",
  isDateless = false,
  numberOfCards = 3,
  tagCategories = DEFAULT_TAG_CATEGORIES,
  taggedOptionIds = [DEFAULT_CATEGORY_OPTION_ID],
}: Partial<
  Omit<CollectionBlockProps, "site"> & {
    isDateless?: boolean
    numberOfCards?: number
    withImageFallback?: boolean
    tagCategories?: TagCategories
    taggedOptionIds?: string[]
  }
>): Partial<CollectionBlockProps> => {
  const cards: IsomerSitemap[] = [
    {
      id: "3",
      title:
        "Date of Government Gazette Notification on Dissolution of Parliament",
      tagged: taggedOptionIds,
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
      tagged: taggedOptionIds,
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
      tagged: taggedOptionIds,
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
            collectionPagePageProps: {
              tagCategories,
            },
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

export const WithoutPlaintextTags: Story = {
  name: "Without Plaintext Tags",
  args: generateArgs({
    displayThumbnail: true,
    displayCategory: true,
    tagCategories: [],
    taggedOptionIds: [],
  }),
}

const TOPIC_OPTION_1_ID = "topic-option-environment"
const TOPIC_OPTION_2_ID = "topic-option-wildlife"
const REGION_OPTION_ID = "region-option-southeast-asia"

export const MultiplePlaintextTags: Story = {
  name: "Multiple Plaintext Tags",
  args: generateArgs({
    displayThumbnail: true,
    displayCategory: true,
    // One group with 2 selected options (comma-joined) and another with
    // only 1, so both the comma and the dot separator are visible together
    tagCategories: [
      {
        label: "Topic",
        id: "topic-group",
        isRequired: true,
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
        options: [
          { label: "Environment", id: TOPIC_OPTION_1_ID },
          { label: "Wildlife", id: TOPIC_OPTION_2_ID },
        ],
      },
      {
        label: "Region",
        id: "region-group",
        isRequired: true,
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
        options: [{ label: "Southeast Asia", id: REGION_OPTION_ID }],
      },
    ],
    taggedOptionIds: [TOPIC_OPTION_1_ID, TOPIC_OPTION_2_ID, REGION_OPTION_ID],
  }),
}
