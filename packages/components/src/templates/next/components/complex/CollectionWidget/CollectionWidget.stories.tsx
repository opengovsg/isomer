import type { Meta, StoryObj } from "@storybook/react"

import type { CollectionWidgetProps } from "~/interfaces"
import CollectionWidget from "./CollectionWidget"

const meta: Meta<CollectionWidgetProps> = {
  title: "Next/Components/CollectionWidget",
  component: CollectionWidget,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    site: {
      siteName: "Isomer Next",
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
            children: [
              {
                id: "3",
                title:
                  "Date of Government Gazette Notification on Dissolution of Parliament",
                category: "yes i am a category",
                permalink: "/collection-1/item-1",
                layout: "article",
                summary: "",
                date: "2021-01-03",
                lastModified: new Date("2021-01-03").toISOString(),
                children: [],
                image: {
                  src: "https://placehold.co/600x400?text=image%201",
                  alt: "Image 1",
                },
              },
              {
                id: "4",
                title:
                  "Impact of Foreign Professionals on our Economy and Society",
                category: "yes i am a category",
                permalink: "/collection-1/item-2",
                layout: "article",
                summary: "",
                date: "2021-01-02",
                lastModified: new Date("2021-01-02").toISOString(),
                children: [],
                image: {
                  src: "https://placehold.co/600x400?text=image%202",
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
                date: "2021-01-01",
                lastModified: new Date("2021-01-01").toISOString(),
                children: [],
                image: {
                  src: "https://placehold.co/600x400?text=image%203",
                  alt: "Image 3",
                },
              },
            ],
          },
        ],
      },
      theme: "isomer-next",
      isGovernment: true,
      logoUrl: "/isomer-logo.svg",
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
type Story = StoryObj<typeof CollectionWidget>

const generateArgs = ({
  collectionReferenceLink = "[resource:1:2]",
  displayThumbnail,
  displayCategory,
  buttonLabel = "View all corrections",
}: Partial<
  Omit<CollectionWidgetProps, "site">
>): Partial<CollectionWidgetProps> => {
  return {
    type: "collectionwidget",
    collectionReferenceLink,
    displayThumbnail,
    displayCategory,
    buttonLabel,
  }
}

export const WithImage: Story = {
  name: "With Image",
  args: generateArgs({ displayThumbnail: true, displayCategory: true }),
}

export const WithoutImage: Story = {
  name: "Without Image",
  args: generateArgs({ displayThumbnail: false, displayCategory: true }),
}

export const WithoutCategory: Story = {
  name: "Without Category",
  args: generateArgs({ displayThumbnail: true, displayCategory: false }),
}
