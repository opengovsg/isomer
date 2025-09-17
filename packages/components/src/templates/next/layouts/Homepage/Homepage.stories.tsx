import type { Meta, StoryObj } from "@storybook/react"
import { http, HttpResponse } from "msw"

import { withChromaticModes } from "@isomer/storybook-config"

import type { HomePageSchemaType } from "~/engine"
import type { HeroProps } from "~/interfaces/complex/Hero"
import {
  SEARCHSG_TEST_CLIENT_ID,
  withSearchSgSetup,
} from "~/stories/decorators"
import { generateSiteConfig } from "~/stories/helpers"
import { getSingaporeDateYYYYMMDD } from "../../components/complex/DynamicDataBanner/utils"
import Homepage from "./Homepage"

const meta: Meta<typeof Homepage> = {
  title: "Next/Layouts/Homepage",
  component: Homepage,
  decorators: [withSearchSgSetup()],
  argTypes: {},
  tags: ["!autodocs"],
  parameters: {
    layout: "fullscreen",
    chromatic: withChromaticModes([
      "mobileSmall",
      "mobile",
      "tablet",
      "desktop",
    ]),
    themes: {
      themeOverride: "Isomer Next",
    },
    msw: {
      handlers: [
        http.get("https://jsonplaceholder.com/muis_prayers_time", () => {
          return HttpResponse.json({
            [getSingaporeDateYYYYMMDD()]: {
              hijriDate: "17 Jamadilawal 1442H",
              subuh: "5:44am",
              syuruk: "7:08am",
              zohor: "1:10pm",
              asar: "4:34pm",
              maghrib: "7:11pm",
              isyak: "8:25pm",
            },
          })
        }),
      ],
    },
  },
}
export default meta
type Story = StoryObj<typeof Homepage>

const generateArgs = ({
  heroProps,
  isDarkVariant = false,
}: {
  heroProps: Partial<HeroProps>
  isDarkVariant?: boolean
}): HomePageSchemaType => {
  return {
    layout: "homepage",
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
            permalink: "/collection",
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
                lastModified: "2021-01-03",
                children: [],
                image: {
                  src: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=3715&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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
                lastModified: "2021-01-02",
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
                date: "2021-01-01",
                lastModified: "2021-01-01",
                children: [],
                image: {
                  src: "https://images.unsplash.com/photo-1511044568932-338cba0ad803?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  alt: "Image 3",
                },
              },
            ],
          },
        ],
      },
      navbar: {
        items: [
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
      },
      search: {
        type: "searchSG",
        clientId: SEARCHSG_TEST_CLIENT_ID,
      },
    }),
    meta: {
      description: "A Next.js starter for Isomer",
    },
    page: {
      permalink: "/",
      lastModified: "2024-05-02T14:12:57.160Z",
      title: "Home page",
    },
    content: [
      {
        type: "dynamicdatabanner",
        apiEndpoint: "https://jsonplaceholder.com/muis_prayers_time",
        title: "hijriDate",
        data: [
          {
            label: "Subuh",
            key: "subuh",
          },
          {
            label: "Syuruk",
            key: "syuruk",
          },
          {
            label: "Zohor",
            key: "zohor",
          },
          {
            label: "Asar",
            key: "asar",
          },
          {
            label: "Maghrib",
            key: "maghrib",
          },
          {
            label: "Ishak",
            key: "isyak",
          },
        ],
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        label: "View all dates",
        errorMessage: [
          {
            text: "Couldn’t load prayer times. Try refreshing the page.",
            type: "text",
          },
        ],
      },
      heroProps as HeroProps,
      {
        type: "infobar",
        variant: isDarkVariant ? "dark" : "light",
        title: "This is a place where you can put nice content",
        description: "About a sentence worth of description here",
        buttonLabel: "Primary CTA",
        buttonUrl: "/",
        secondaryButtonLabel: "Secondary CTA",
        secondaryButtonUrl: "/",
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
        buttonUrl: "/",
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
        variant: "full",
        type: "infopic",
        title:
          "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
        description:
          "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
        imageAlt: "alt",
        imageSrc: "https://placehold.co/200x200",
        buttonLabel: "Primary CTA",
        buttonUrl: "/",
      },
      {
        variant: "full",
        type: "infopic",
        title:
          "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
        description:
          "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
        imageAlt: "alt",
        imageSrc: "https://placehold.co/200x200",
        buttonLabel: "Primary CTA",
        buttonUrl: "/",
      },
      {
        type: "infocards",
        variant: "cardsWithFullImages",
        title: "Section title ministry highlights",
        subtitle:
          "Section subtitle, maximum 150 chars. These are some of the things we are working on. As a ministry, we focus on delivering value to the members of public.",
        label: "This is a CTA",
        url: "/",
        cards: [
          {
            title: "Card with short title",
            url: "https://www.google.com",
            imageUrl: "https://placehold.co/200x300",
            imageAlt: "alt text",
          },
          {
            title: "Hover on me to see me change colors",
            url: "https://www.google.com",
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
        type: "infocards",
        maxColumns: "3",
        title: "Section title ministry highlights",
        subtitle:
          "Section subtitle, maximum 150 chars. These are some of the things we are working on. As a ministry, we focus on delivering value to the members of public.",
        variant: "cardsWithImages",
        label: "This is a CTA",
        url: "/",
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
        type: "blockquote",
        quote:
          "I managed to experience new things: saw a dead fish in a plastic bag for the first time, which was an eye-opener because I never thought I would actually get to see something like this ever.",
        source: "Hannah Teo, Greenies ambassador",
        imageSrc: "https://placehold.co/600x600",
        imageAlt: "This is the alt text",
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
      {
        type: "collectionblock",
        collectionReferenceLink: "[resource:1:2]",
        displayThumbnail: true,
        displayCategory: true,
        buttonLabel: "View all corrections",
      },
      {
        type: "blockquote",
        quote:
          "I managed to experience new things: saw a dead fish in a plastic bag for the first time, which was an eye-opener because I never thought I would actually get to see something like this ever.",
        source: "Hannah Teo, Greenies ambassador",
        imageSrc: "https://placehold.co/600x600",
        imageAlt: "This is the alt text",
      },
    ],
  }
}

export const Default: Story = {
  args: generateArgs({
    heroProps: {
      type: "hero",
      variant: "gradient",
      backgroundUrl: "/hero-banner.png",
      title: "Ministry of Trade and Industry",
      subtitle:
        "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
      buttonLabel: "Main CTA",
      buttonUrl: "/",
      secondaryButtonLabel: "Sub CTA",
      secondaryButtonUrl: "/",
    },
  }),
}

export const Dark: Story = {
  args: generateArgs({
    heroProps: {
      type: "hero",
      variant: "gradient",
      backgroundUrl: "/hero-banner.png",
      title: "Ministry of Trade and Industry",
      subtitle:
        "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
      buttonLabel: "Main CTA",
      buttonUrl: "/",
      secondaryButtonLabel: "Sub CTA",
      secondaryButtonUrl: "/",
    },
    isDarkVariant: true,
  }),
}

export const HeroLargeImage: Story = {
  args: generateArgs({
    heroProps: {
      type: "hero",
      variant: "largeImage",
      backgroundUrl: "/hero-banner.png",
      title: "Hi I am a ministry’s title keep it under 50 please",
      subtitle:
        "Max 250 chars please. A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity. A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity. A leading global city of enterprise",
      buttonLabel: "Learn more about us",
      buttonUrl: "/",
      secondaryButtonLabel: "Learn more about us",
      secondaryButtonUrl: "/",
    },
  }),
}

export const HeroFloating: Story = {
  args: generateArgs({
    heroProps: {
      type: "hero",
      variant: "floating",
      backgroundUrl: "/hero-banner.png",
      title: "Youths, the future of our nation",
      subtitle:
        "Empowering the next generation to lead with courage, creativity, and community spirit. Today's youth are shaping tomorrow’s world — and the future looks bright.",
      buttonLabel: "Explore now",
      buttonUrl: "/",
      secondaryButtonLabel: "Explore now",
      secondaryButtonUrl: "/",
    },
  }),
}

export const HeroFloatingShortText: Story = {
  args: generateArgs({
    heroProps: {
      type: "hero",
      variant: "floating",
      backgroundUrl: "/hero-banner.png",
      title: "Short",
      subtitle: "Is Still Full Width",
      buttonLabel: "Explore now",
      buttonUrl: "/",
      secondaryButtonLabel: "Explore now",
      secondaryButtonUrl: "/",
    },
  }),
}

export const HeroSearchbar: Story = {
  args: generateArgs({
    heroProps: {
      type: "hero",
      variant: "searchbar",
      title: "Temasek Polytechnic",
      subtitle:
        "APEX connects agencies and the public through a single, secure hub for Singapore’s government APIs.",
    },
  }),
}
