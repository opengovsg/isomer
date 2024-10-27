import type { Meta, StoryObj } from "@storybook/react"

import { withChromaticModes } from "@isomer/storybook-config"

import type { CollectionCardProps } from "~/interfaces"
import { ISOMER_PAGE_LAYOUTS } from "~/types"
import { CollectionCard } from "./CollectionCard"

const meta: Meta<CollectionCardProps> = {
  title: "Next/Internal Components/CollectionCard",
  component: CollectionCard,
  argTypes: {},
  parameters: {
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
    chromatic: withChromaticModes(["desktop", "mobile"]),
  },
  args: {
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Home",
        permalink: "/",
        lastModified: "",
        layout: ISOMER_PAGE_LAYOUTS.Homepage,
        summary: "",
        children: [],
      },
      theme: "isomer-next",
      isGovernment: true,
      logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
      lastUpdated: "2021-10-01",
      assetsBaseUrl: "https://cms.isomer.gov.sg",
      navBarItems: [],
      footerItems: {
        privacyStatementLink: "https://www.isomer.gov.sg/privacy",
        termsOfUseLink: "https://www.isomer.gov.sg/terms",
        siteNavItems: [],
      },
      search: {
        type: "localSearch",
        searchUrl: "/search",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof CollectionCard>

const generateArgs = ({
  variant,
  shouldShowDate = true,
  isLastUpdatedUndefined = false,
  withoutImage = false,
  fileDetails,
}: {
  variant: string
  shouldShowDate?: boolean
  isLastUpdatedUndefined?: boolean
  withoutImage?: boolean
  fileDetails?: {
    type: string
    size: string
  }
}): Partial<CollectionCardProps> & { shouldShowDate?: boolean } => {
  return {
    lastUpdated: isLastUpdatedUndefined ? undefined : "December 2, 2023",
    category: "Research",
    title:
      "A journal on microscopic plastic and their correlation to the number of staycations enjoyed per millennials between the ages of 30-42, substantiated by research from IDK university",
    url: "/",
    description:
      "We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year. We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year.",
    image: withoutImage
      ? undefined
      : {
          src: "https://placehold.co/500x500",
          alt: "placeholder",
        },
    variant: variant as "link" | "article" | "file" | undefined,
    fileDetails,
    shouldShowDate,
  }
}

export const Default: Story = {
  args: generateArgs({ variant: "article" }),
}

export const UndefinedDate: Story = {
  args: generateArgs({ variant: "article", isLastUpdatedUndefined: true }),
}

export const HideDate: Story = {
  args: generateArgs({
    variant: "article",
    shouldShowDate: false,
    isLastUpdatedUndefined: true,
  }),
}

export const ArticleWithoutImage: Story = {
  args: generateArgs({ variant: "article", withoutImage: true }),
}

export const File: Story = {
  args: generateArgs({
    variant: "file",
    fileDetails: { type: "pdf", size: "2.3 MB" },
  }),
}

export const FileWithoutImage: Story = {
  args: generateArgs({
    variant: "file",
    withoutImage: true,
    fileDetails: { type: "pdf", size: "2.3 MB" },
  }),
}
