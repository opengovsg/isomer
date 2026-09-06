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
  argTypes: {},
  component: CollectionBlock,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Components/CollectionBlock",
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
    display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
    id: "category-group",
    isRequired: true,
    label: "Category",
    options: [{ id: DEFAULT_CATEGORY_OPTION_ID, label: "yes i am a category" }],
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
  const firstCard: IsomerSitemap = {
    children: [],
    date: isDateless ? undefined : "2021-01-03",
    id: "3",
    lastModified: isDateless ? "" : new Date("2021-01-03").toISOString(),
    layout: "article",
    permalink: "/collection-1/item-1",
    summary: "",
    tagged: taggedOptionIds,
    title:
      "Date of Government Gazette Notification on Dissolution of Parliament",
  }
  if (!withImageFallback) {
    firstCard.image = {
      alt: "Image 1",
      src: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=3715&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    }
  }

  const cards: IsomerSitemap[] = [
    firstCard,
    {
      children: [],
      date: isDateless ? undefined : "2021-01-02",
      id: "4",
      image: {
        alt: "Image 2",
        src: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=3024&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
      lastModified: isDateless ? "" : new Date("2021-01-02").toISOString(),
      layout: "article",
      permalink: "/collection-1/item-2",
      summary: "",
      tagged: taggedOptionIds,
      title: "Impact of Foreign Professionals on our Economy and Society",
    },
    {
      children: [],
      date: isDateless ? undefined : "2021-01-01",
      id: "5",
      image: {
        alt: "Image 3",
        src: "https://images.unsplash.com/photo-1511044568932-338cba0ad803?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
      lastModified: isDateless ? "" : new Date("2021-01-01").toISOString(),
      layout: "article",
      permalink: "/collection-1/item-3",
      summary: "",
      tagged: taggedOptionIds,
      title: "Where does Government revenue come from?",
    },
  ]

  return {
    buttonLabel,
    collectionReferenceLink,
    displayCategory,
    displayThumbnail,
    headingLevel: 2,
    site: generateSiteConfig({
      siteMap: {
        children: [
          {
            children: cards.slice(0, numberOfCards),
            collectionPagePageProps: {
              tagCategories,
            },
            id: "2",
            lastModified: "2021-01-01",
            layout: "collection",
            permalink: "/collection-1",
            summary:
              "Clarifying widespread or common misperceptions of Government policy, or inaccurate assertions on matters of public concern that can harm Singapore's social fabric.",
            title: "Corrections and Clarifications",
          },
        ],
        id: "1",
        lastModified: "",
        layout: "homepage",
        permalink: "/",
        summary: "",
        title: "Home",
      },
    }),
    type: "collectionblock",
  }
}

export const WithImage: Story = {
  args: generateArgs({ displayCategory: true, displayThumbnail: true }),
  name: "With Image",
}

export const WithImageFallback: Story = {
  args: generateArgs({
    displayCategory: true,
    displayThumbnail: true,
    withImageFallback: true,
  }),
  name: "With Image Fallback",
}

export const WithoutImage: Story = {
  args: generateArgs({ displayCategory: true, displayThumbnail: false }),
  name: "Without Image",
}

export const WithoutCategory: Story = {
  args: generateArgs({ displayCategory: false, displayThumbnail: true }),
  name: "Without Category",
}

export const DatelessVariant: Story = {
  args: generateArgs({
    displayCategory: true,
    displayThumbnail: true,
    isDateless: true,
  }),
  name: "Dateless Variant",
}

export const OneCard: Story = {
  args: generateArgs({
    displayCategory: true,
    displayThumbnail: true,
    numberOfCards: 1,
  }),
  name: "One Card",
}

export const TwoCards: Story = {
  args: generateArgs({
    displayCategory: true,
    displayThumbnail: true,
    numberOfCards: 2,
  }),
  name: "Two Cards",
}

export const WithoutPlaintextTags: Story = {
  args: generateArgs({
    displayCategory: true,
    displayThumbnail: true,
    tagCategories: [],
    taggedOptionIds: [],
  }),
  name: "Without Plaintext Tags",
}

const TOPIC_OPTION_1_ID = "topic-option-environment"
const TOPIC_OPTION_2_ID = "topic-option-wildlife"
const REGION_OPTION_ID = "region-option-southeast-asia"

export const MultiplePlaintextTags: Story = {
  args: generateArgs({
    displayThumbnail: true,
    displayCategory: true,
    // One group with 2 selected options (comma-joined) and another with
    // only 1, so both the comma and the dot separator are visible together
    tagCategories: [
      {
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
        id: "topic-group",
        isRequired: true,
        label: "Topic",
        options: [
          { id: TOPIC_OPTION_1_ID, label: "Environment" },
          { id: TOPIC_OPTION_2_ID, label: "Wildlife" },
        ],
      },
      {
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
        id: "region-group",
        isRequired: true,
        label: "Region",
        options: [{ id: REGION_OPTION_ID, label: "Southeast Asia" }],
      },
    ],
    taggedOptionIds: [TOPIC_OPTION_1_ID, TOPIC_OPTION_2_ID, REGION_OPTION_ID],
  }),
  name: "Multiple Plaintext Tags",
}
