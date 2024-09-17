import type { Meta, StoryObj } from "@storybook/react"
import { useEffect } from "react"

import { withChromaticModes } from "@isomer/storybook-config"

import type { HomePageSchemaType } from "~/engine"
import Homepage from "./Homepage"

// Template for stories
const Template = (props: HomePageSchemaType) => {
  // Note: This is needed because the script tag is not rendered in the storybook
  useEffect(() => {
    const scriptTag = document.createElement("script")
    scriptTag.src = `https://api.search.gov.sg/v1/searchconfig.js?clientId=${TEST_CLIENT_ID}`
    scriptTag.setAttribute("defer", "")
    document.body.appendChild(scriptTag)
  }, [])
  return <Homepage {...props} />
}

const meta: Meta<typeof Homepage> = {
  title: "Next/Layouts/Homepage",
  component: Homepage,
  render: Template,
  argTypes: {},
  tags: ["!autodocs"],
  parameters: {
    layout: "fullscreen",
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof Homepage>

const TEST_CLIENT_ID = "5485bb61-2d5d-440a-bc37-91c48fc0c9d4"

export const Default: Story = {
  name: "Homepage",
  args: {
    layout: "homepage",
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Home",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [],
      },
      theme: "isomer-next",
      isGovernment: true,
      logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
      navBarItems: [
        {
          name: "About us",
          url: "/item-one",
          items: [
            {
              name: "PA's network one",
              url: "/item-one/pa-network-one",
              description:
                "Click here and brace yourself for mild disappointment.",
            },
            {
              name: "PA's network two",
              url: "/item-one/pa-network-two",
              description:
                "Click here and brace yourself for mild disappointment.",
            },
            {
              name: "PA's network three",
              url: "/item-one/pa-network-three",
            },
            {
              name: "PA's network four",
              url: "/item-one/pa-network-four",
              description:
                "Click here and brace yourself for mild disappointment. This one has a pretty long one",
            },
            {
              name: "PA's network five",
              url: "/item-one/pa-network-five",
              description:
                "Click here and brace yourself for mild disappointment. This one has a pretty long one",
            },
            {
              name: "PA's network six",
              url: "/item-one/pa-network-six",
              description:
                "Click here and brace yourself for mild disappointment.",
            },
          ],
        },
        {
          name: "Industries",
          url: "/item-two",
          description: "This is a description of the item.",
          items: [
            {
              name: "A sub item",
              url: "/item-two/sub-item",
              description:
                "Click here and brace yourself for mild disappointment.",
            },
            {
              name: "Another sub item",
              url: "/item-two/another-sub-item",
            },
          ],
        },
        {
          name: "Media",
          url: "/item-three",
          items: [
            {
              name: "A sub item",
              url: "/item-three/sub-item",
            },
            {
              name: "Another sub item",
              url: "/item-three/another-sub-item",
              description:
                "Click here and brace yourself for mild disappointment.",
            },
          ],
        },
        {
          name: "Careers",
          url: "/item-four",
          items: [
            {
              name: "A sub item",
              url: "/item-four/sub-item",
            },
            {
              name: "Another sub item",
              url: "/item-four/another-sub-item",
            },
          ],
        },
        {
          name: "Publications",
          url: "/item-five",
          items: [
            {
              name: "A sub item",
              url: "/item-five/sub-item",
            },
            {
              name: "Another sub item",
              url: "/item-five/another-sub-item",
            },
          ],
        },
        {
          name: "Newsroom",
          url: "/item-six",
          items: [
            {
              name: "A sub item",
              url: "/item-six/sub-item",
            },
            {
              name: "Another sub item",
              url: "/item-six/another-sub-item",
            },
          ],
        },
        {
          name: "Contact us",
          url: "/single-item",
        },
      ],
      footerItems: {
        privacyStatementLink: "https://www.isomer.gov.sg/privacy",
        termsOfUseLink: "https://www.isomer.gov.sg/terms",
        siteNavItems: [],
      },
      lastUpdated: "1 Jan 2021",
      search: {
        type: "searchSG",
        clientId: TEST_CLIENT_ID,
      },
    },
    page: {
      noIndex: false,
      permalink: "/",
      lastModified: "2024-05-02T14:12:57.160Z",
      title: "Home page",
      description: "A Next.js starter for Isomer",
    },
    content: [
      {
        type: "hero",
        variant: "gradient",
        backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
        title: "Ministry of Trade and Industry",
        subtitle:
          "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
        buttonLabel: "Main CTA",
        buttonUrl: "/",
        secondaryButtonLabel: "Sub CTA",
        secondaryButtonUrl: "/",
      },
      {
        type: "infobar",
        title: "This is a place where you can put nice content",
        description: "About a sentence worth of description here",
        buttonLabel: "Primary CTA",
        buttonUrl: "https://google.com",
        secondaryButtonLabel: "Secondary CTA",
        secondaryButtonUrl: "https://google.com",
      },
      {
        type: "infopic",
        title:
          "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
        description:
          "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
        imageAlt: "alt",
        imageSrc: "https://placehold.co/200x200",
        buttonLabel: "Primary CTA",
        buttonUrl: "https://www.google.com",
      },
      {
        type: "infocards",
        title: "Section title ministry highlights",
        subtitle:
          "Section subtitle, maximum 150 chars. These are some of the things we are working on. As a ministry, we focus on delivering value to the members of public.",
        variant: "cardsWithImages",
        cards: [
          {
            title: "Card with short title",
            url: "https://www.google.com",
            description:
              "Card description, 200 chars. In the kingdom of Veridonia, the government operates as a benevolent monarchy, guided by ancient traditions and the wisdom of its sovereign.",
            imageUrl: "https://placehold.co/200x300",
            imageAlt: "alt text",
          },
          {
            title: "Hover on me to see me change colors",
            url: "https://www.google.com",
            description:
              "Card description, 200 chars. In the kingdom of Veridonia, the government operates as a benevolent monarchy, guided by ancient traditions and the wisdom of its sovereign.",
            imageUrl:
              "https://images.unsplash.com/photo-1722260613137-f8f5ac432d69?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            imageAlt: "alt text",
          },
          {
            title: "A yummy, tipsy evening at Duxton",
            url: "https://www.google.com",
            imageUrl: "https://placehold.co/200x300",
            imageAlt: "alt text",
          },
          {
            title: "Testing a card with a larger image and no description",
            imageUrl: "https://placehold.co/500x500",
            imageAlt: "alt text",
          },
        ],
      },
      {
        type: "infopic",
        title:
          "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
        description:
          "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
        imageAlt: "alt",
        imageSrc: "https://placehold.co/200x200",
        buttonLabel: "Primary CTA",
        buttonUrl: "[resource:1:1]",
      },
      {
        type: "infocols",
        title: "Highlights",
        subtitle: "Some of the things that we are working on",
        infoBoxes: [
          {
            title: "Committee of Supply (COS) 2023",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            buttonLabel: "Read article",
            buttonUrl: "/faq",
            icon: "bar-chart",
          },
          {
            title: "Committee of Supply (COS) 2023",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            buttonLabel: "Read article",
            buttonUrl: "https://google.com",
            icon: "bar-chart",
          },
          {
            title: "Committee of Supply (COS) 2023",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            buttonLabel: "Read article",
            buttonUrl: "/faq",
            icon: "bar-chart",
          },
          {
            title: "Committee of Supply (COS) 2023",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            buttonLabel: "Read article",
            buttonUrl: "https://google.com",
            icon: "bar-chart",
          },
          {
            title: "Committee of Supply (COS) 2023",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            buttonLabel: "Read article",
            buttonUrl: "/faq",
            icon: "bar-chart",
          },
          {
            title: "Committee of Supply (COS) 2023",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            buttonLabel: "Read article",
            buttonUrl: "https://google.com",
            icon: "bar-chart",
          },
        ],
      },
      {
        type: "keystatistics",
        title: "Key economic indicators",
        statistics: [
          {
            label: "Advance GDP Estimates, 4Q 2023 (YoY)",
            value: "+2.8%",
          },
          { label: "Total Merchandise Trade, Dec 2023 (YoY)", value: "-6.8%" },
          { label: "Industrial Production, Dec 2023 (YoY)", value: "-2.5%" },
        ],
      },
    ],
  },
}
