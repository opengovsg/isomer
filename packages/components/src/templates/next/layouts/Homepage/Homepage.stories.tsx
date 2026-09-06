/* oxlint-disable typescript/no-unsafe-type-assertion, typescript/no-deprecated -- story/test fixtures use narrowed mock shapes */
import type { Meta, StoryObj } from "@storybook/react-vite"
import type { HeroProps } from "~/interfaces/complex/Hero"
import type { HomePageSchemaType } from "~/types"
import { http, HttpResponse } from "msw"
import {
  SEARCHSG_TEST_CLIENT_ID,
  withSearchSgSetup,
} from "~/stories/decorators"
import { generateSiteConfig } from "~/stories/helpers"
import { TAG_CATEGORY_DISPLAY_OPTIONS } from "~/types/constants"

import { withChromaticModes } from "@isomer/storybook-config"

import { getSingaporeDateYYYYMMDD } from "../../components/complex/DynamicDataBanner/utils"
import { HomepageLayout } from "./Homepage"

const meta: Meta<typeof HomepageLayout> = {
  argTypes: {},
  component: HomepageLayout,
  decorators: [withSearchSgSetup()],
  parameters: {
    chromatic: withChromaticModes([
      "mobileSmall",
      "mobile",
      "tablet",
      "desktop",
    ]),
    layout: "fullscreen",
    msw: {
      handlers: [
        http.get("https://jsonplaceholder.com/muis_prayers_time", () =>
          HttpResponse.json({
            [getSingaporeDateYYYYMMDD()]: {
              asar: "4:34pm",
              hijriDate: "17 Jamadilawal 1442H",
              isyak: "8:25pm",
              maghrib: "7:11pm",
              subuh: "5:44am",
              syuruk: "7:08am",
              zohor: "1:10pm",
            },
          }),
        ),
      ],
    },
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  tags: ["!autodocs"],
  title: "Next/Layouts/Homepage",
}
export default meta
type Story = StoryObj<typeof HomepageLayout>

const chromaticWithoutMobileSmall = {
  modes: {
    // Chromatic stacks story modes with the modes inherited from meta.
    mobileSmall: { disable: true },
  },
}

// Category is now an ordinary tagCategories group — the option a card is
// tagged with is what CollectionBlock displays under its title.
const HOMEPAGE_CATEGORY_OPTION_ID = "homepage-category-option"

const generateArgs = ({
  heroProps,
  isDarkVariant = false,
}: {
  heroProps: Partial<HeroProps>
  isDarkVariant?: boolean
}): HomePageSchemaType => ({
  content: [
    {
      apiEndpoint: "https://jsonplaceholder.com/muis_prayers_time",
      data: [
        {
          key: "subuh",
          label: "Subuh",
        },
        {
          key: "syuruk",
          label: "Syuruk",
        },
        {
          key: "zohor",
          label: "Zohor",
        },
        {
          key: "asar",
          label: "Asar",
        },
        {
          key: "maghrib",
          label: "Maghrib",
        },
        {
          key: "isyak",
          label: "Ishak",
        },
      ],
      errorMessage: [
        {
          text: "Couldn’t load prayer times. Try refreshing the page.",
          type: "text",
        },
      ],
      label: "View all dates",
      title: "hijriDate",
      type: "dynamicdatabanner",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    // SAFETY: Homepage story composes hero props from a partial fixture object.
    heroProps as HeroProps,
    {
      buttonLabel: "Primary CTA",
      buttonUrl: "/",
      description: "About a sentence worth of description here",
      secondaryButtonLabel: "Secondary CTA",
      secondaryButtonUrl: "/",
      title: "This is a place where you can put nice content",
      type: "infobar",
      variant: isDarkVariant ? "dark" : "light",
    },
    {
      buttonLabel: "Primary CTA",
      buttonUrl: "/",
      description:
        "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
      imageAlt: "alt",
      imageSrc: "https://placehold.co/200x200",
      title:
        "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
      type: "infopic",
    },
    {
      buttonLabel: "Primary CTA",
      buttonUrl: "[resource:1:1]",
      description:
        "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
      imageAlt: "alt",
      imageSrc: "https://placehold.co/200x200",
      title:
        "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
      type: "infopic",
    },
    {
      cards: [
        {
          imageAlt: "alt text",
          imageUrl: "https://placehold.co/200x300",
          title: "Card with short title",
          url: "https://www.google.com",
        },
        {
          imageAlt: "alt text",
          imageUrl:
            "https://images.unsplash.com/photo-1722260613137-f8f5ac432d69?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          title: "Hover on me to see me change colors",
          url: "https://www.google.com",
        },
        {
          imageAlt: "alt text",
          imageUrl: "https://placehold.co/200x300",
          title: "A yummy, tipsy evening at Duxton",
          url: "https://www.google.com",
        },
        {
          imageAlt: "alt text",
          imageUrl: "https://placehold.co/500x500",
          title: "Testing a card with a larger image and no description",
        },
      ],
      label: "This is a CTA",
      subtitle:
        "Section subtitle, maximum 150 chars. These are some of the things we are working on. As a ministry, we focus on delivering value to the members of public.",
      title: "Section title ministry highlights",
      type: "infocards",
      url: "/",
      variant: "cardsWithFullImages",
    },
    {
      cards: [
        {
          description:
            "Card description, 200 chars. In the kingdom of Veridonia, the government operates as a benevolent monarchy, guided by ancient traditions and the wisdom of its sovereign.",
          imageAlt: "alt text",
          imageUrl: "https://placehold.co/200x300",
          title: "Card with short title",
          url: "https://www.google.com",
        },
        {
          description:
            "Card description, 200 chars. In the kingdom of Veridonia, the government operates as a benevolent monarchy, guided by ancient traditions and the wisdom of its sovereign.",
          imageAlt: "alt text",
          imageUrl:
            "https://images.unsplash.com/photo-1722260613137-f8f5ac432d69?q=80&w=3570&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          title: "Hover on me to see me change colors",
          url: "https://www.google.com",
        },
        {
          imageAlt: "alt text",
          imageUrl: "https://placehold.co/200x300",
          title: "A yummy, tipsy evening at Duxton",
          url: "https://www.google.com",
        },
        {
          imageAlt: "alt text",
          imageUrl: "https://placehold.co/500x500",
          title: "Testing a card with a larger image and no description",
        },
      ],
      label: "This is a CTA",
      maxColumns: "3",
      subtitle:
        "Section subtitle, maximum 150 chars. These are some of the things we are working on. As a ministry, we focus on delivering value to the members of public.",
      title: "Section title ministry highlights",
      type: "infocards",
      url: "/",
      variant: "cardsWithImages",
    },
    {
      buttonLabel: "Primary CTA",
      buttonUrl: "[resource:1:1]",
      description:
        "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
      imageAlt: "alt",
      imageSrc: "https://placehold.co/200x200",
      title:
        "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
      type: "infopic",
    },
    {
      imageAlt: "This is the alt text",
      imageSrc: "https://placehold.co/600x600",
      quote:
        "I managed to experience new things: saw a dead fish in a plastic bag for the first time, which was an eye-opener because I never thought I would actually get to see something like this ever.",
      source: "Hannah Teo, Greenies ambassador",
      type: "blockquote",
    },
    {
      infoBoxes: [
        {
          buttonLabel: "Read article",
          buttonUrl: "/faq",
          description: "Building a Vibrant Economy, Nurturing Enterprises",
          icon: "bar-chart",
          title: "Committee of Supply (COS) 2023",
        },
        {
          buttonLabel: "Read article",
          buttonUrl: "https://google.com",
          description: "Building a Vibrant Economy, Nurturing Enterprises",
          icon: "bar-chart",
          title: "Committee of Supply (COS) 2023",
        },
        {
          buttonLabel: "Read article",
          buttonUrl: "/faq",
          description: "Building a Vibrant Economy, Nurturing Enterprises",
          icon: "bar-chart",
          title: "Committee of Supply (COS) 2023",
        },
        {
          buttonLabel: "Read article",
          buttonUrl: "https://google.com",
          description: "Building a Vibrant Economy, Nurturing Enterprises",
          icon: "bar-chart",
          title: "Committee of Supply (COS) 2023",
        },
        {
          buttonLabel: "Read article",
          buttonUrl: "/faq",
          description: "Building a Vibrant Economy, Nurturing Enterprises",
          icon: "bar-chart",
          title: "Committee of Supply (COS) 2023",
        },
        {
          buttonLabel: "Read article",
          buttonUrl: "https://google.com",
          description: "Building a Vibrant Economy, Nurturing Enterprises",
          icon: "bar-chart",
          title: "Committee of Supply (COS) 2023",
        },
      ],
      subtitle: "Some of the things that we are working on",
      title: "Highlights",
      type: "infocols",
    },
    {
      statistics: [
        {
          label: "Advance GDP Estimates, 4Q 2023 (YoY)",
          value: "+2.8%",
        },
        { label: "Total Merchandise Trade, Dec 2023 (YoY)", value: "-6.8%" },
        { label: "Industrial Production, Dec 2023 (YoY)", value: "-2.5%" },
      ],
      title: "Key economic indicators",
      type: "keystatistics",
    },
    {
      buttonLabel: "View all corrections",
      collectionReferenceLink: "[resource:1:2]",
      displayCategory: true,
      displayThumbnail: true,
      type: "collectionblock",
    },
    {
      imageAlt: "This is the alt text",
      imageSrc: "https://placehold.co/600x600",
      quote:
        "I managed to experience new things: saw a dead fish in a plastic bag for the first time, which was an eye-opener because I never thought I would actually get to see something like this ever.",
      source: "Hannah Teo, Greenies ambassador",
      type: "blockquote",
    },
    {
      description:
        "Click “More ways to contact us” to find our address, fax number, and other contact details.",
      label: "More ways to contact us",
      methods: [
        {
          label: "Ambassador (Non-Resident)",
          method: "person",
          values: ["Mr MOHAMMAD Alami Musa"],
        },
        {
          label: "Chancery",
          method: "address",
          values: [
            "c/o Ministry of Foreign Affairs",
            "Tanglin",
            "Singapore 248163",
          ],
        },
        {
          label: "Telephone",
          method: "telephone",
          values: ["+65-63798000 (MFA)"],
        },
        {
          caption: "Got people use meh?",
          label: "Fax",
          method: "fax",
          values: ["+65-64747885 (MFA)"],
        },
        {
          label: "Email",
          method: "email",
          values: [
            "do-not-reply@isomer.gov.sg",
            "do-not-reply-pelase@isomer.gov.sg",
          ],
        },
        {
          label: "Website",
          method: "website",
          values: ["https://www.isomer.gov.sg", "https://sample.isomer.gov.sg"],
        },
        {
          caption: "(after hours)",
          label: "In the case of emergency",
          method: "emergency_contact",
          values: ["+65 5678 1234"],
        },
        {
          label: "Operating Hours",
          method: "operating_hours",
          values: ["Mon - Fri", "8.30 am to 5.00 pm", "Sat & Sun - Closed"],
        },
        {
          label: "Telegram",
          values: ["https://t.me/isomer_gov_sg"],
        },
        {
          label: "WhatsApp",
          values: ["+65-63798000 (MFA)"],
        },
      ],
      title: "Contact the High Commission of Canberra",
      type: "contactinformation",
      url: "/",
    },
    {
      images: [
        {
          alt: "placeholder logo",
          src: "https://placehold.co/150",
        },
        {
          alt: "placeholder logo",
          src: "https://placehold.co/150",
        },
        {
          alt: "placeholder logo",
          src: "https://placehold.co/150",
        },
      ],
      title: "Our partners",
      type: "logocloud",
    },
    {
      type: "antiscambanner",
    },
  ],
  layout: "homepage",
  meta: {
    description: "A Next.js starter for Isomer",
  },
  page: {
    lastModified: "2024-05-02T14:12:57.160Z",
    permalink: "/",
    title: "Home page",
  },
  site: generateSiteConfig({
    navbar: {
      items: [
        {
          items: [
            {
              description:
                "Click here and brace yourself for mild disappointment.",
              name: "PA's network one",
              url: "/item-one/pa-network-one",
            },
            {
              description:
                "Click here and brace yourself for mild disappointment.",
              name: "PA's network two",
              url: "/item-one/pa-network-two",
            },
            {
              name: "PA's network three",
              url: "/item-one/pa-network-three",
            },
            {
              description:
                "Click here and brace yourself for mild disappointment. This one has a pretty long one",
              name: "PA's network four",
              url: "/item-one/pa-network-four",
            },
            {
              description:
                "Click here and brace yourself for mild disappointment. This one has a pretty long one",
              name: "PA's network five",
              url: "/item-one/pa-network-five",
            },
            {
              description:
                "Click here and brace yourself for mild disappointment.",
              name: "PA's network six",
              url: "/item-one/pa-network-six",
            },
          ],
          name: "About us",
          url: "/item-one",
        },
        {
          description: "This is a description of the item.",
          items: [
            {
              description:
                "Click here and brace yourself for mild disappointment.",
              name: "A sub item",
              url: "/item-two/sub-item",
            },
            {
              name: "Another sub item",
              url: "/item-two/another-sub-item",
            },
          ],
          name: "Industries",
          url: "/item-two",
        },
        {
          items: [
            {
              name: "A sub item",
              url: "/item-three/sub-item",
            },
            {
              description:
                "Click here and brace yourself for mild disappointment.",
              name: "Another sub item",
              url: "/item-three/another-sub-item",
            },
          ],
          name: "Media",
          url: "/item-three",
        },
        {
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
          name: "Careers",
          url: "/item-four",
        },
        {
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
          name: "Publications",
          url: "/item-five",
        },
        {
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
          name: "Newsroom",
          url: "/item-six",
        },
        {
          name: "Contact us",
          url: "/single-item",
        },
      ],
    },
    search: {
      clientId: SEARCHSG_TEST_CLIENT_ID,
      type: "searchSG",
    },
    siteMap: {
      children: [
        {
          children: [
            {
              children: [],
              date: "2021-01-03",
              id: "3",
              image: {
                alt: "Image 1",
                src: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=3715&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              },
              lastModified: "2021-01-03",
              layout: "article",
              permalink: "/collection-1/item-1",
              summary: "",
              tagged: [HOMEPAGE_CATEGORY_OPTION_ID],
              title:
                "Date of Government Gazette Notification on Dissolution of Parliament",
            },
            {
              children: [],
              date: "2021-01-02",
              id: "4",
              image: {
                alt: "Image 2",
                src: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=3024&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              },
              lastModified: "2021-01-02",
              layout: "article",
              permalink: "/collection-1/item-2",
              summary: "",
              tagged: [HOMEPAGE_CATEGORY_OPTION_ID],
              title:
                "Impact of Foreign Professionals on our Economy and Society",
            },
            {
              children: [],
              date: "2021-01-01",
              id: "5",
              image: {
                alt: "Image 3",
                src: "https://images.unsplash.com/photo-1511044568932-338cba0ad803?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              },
              lastModified: "2021-01-01",
              layout: "article",
              permalink: "/collection-1/item-3",
              summary: "",
              tagged: [HOMEPAGE_CATEGORY_OPTION_ID],
              title: "Where does Government revenue come from?",
            },
          ],
          collectionPagePageProps: {
            tagCategories: [
              {
                display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
                id: "category-group",
                isRequired: true,
                label: "Category",
                options: [
                  {
                    id: HOMEPAGE_CATEGORY_OPTION_ID,
                    label: "yes i am a category",
                  },
                ],
              },
            ],
          },
          id: "2",
          lastModified: "2021-01-01",
          layout: "collection",
          permalink: "/collection",
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
})

export const Default: Story = {
  args: generateArgs({
    heroProps: {
      backgroundUrl: "/hero-banner.png",
      buttonLabel: "Main CTA",
      buttonUrl: "/",
      secondaryButtonLabel: "Sub CTA",
      secondaryButtonUrl: "/",
      subtitle:
        "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
      title: "Ministry of Trade and Industry",
      type: "hero",
      variant: "gradient",
    },
  }),
}

export const Dark: Story = {
  args: generateArgs({
    heroProps: {
      backgroundUrl: "/hero-banner.png",
      buttonLabel: "Main CTA",
      buttonUrl: "/",
      secondaryButtonLabel: "Sub CTA",
      secondaryButtonUrl: "/",
      subtitle:
        "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
      title: "Ministry of Trade and Industry",
      type: "hero",
      variant: "gradient",
    },
    isDarkVariant: true,
  }),
}

export const HeroBlock: Story = {
  // The full page exceeds Chromatic's capture pixel limit at 320px wide.
  parameters: { chromatic: chromaticWithoutMobileSmall },
  args: generateArgs({
    heroProps: {
      backgroundUrl: "/hero-banner.png",
      buttonLabel: "Explore now",
      buttonUrl: "/",
      secondaryButtonLabel: "Explore now",
      secondaryButtonUrl: "/",
      subtitle:
        "Empowering the next generation to lead with courage, creativity, and community spirit. Today's youth are shaping tomorrow’s world — and the future looks bright.",
      title: "Authorisations for new initiatives",
      type: "hero",
      variant: "block",
    },
  }),
}

export const HeroLargeImage: Story = {
  // The full page exceeds Chromatic's capture pixel limit at 320px wide.
  parameters: { chromatic: chromaticWithoutMobileSmall },
  args: generateArgs({
    heroProps: {
      backgroundUrl: "/hero-banner.png",
      buttonLabel: "Learn more about us",
      buttonUrl: "/",
      secondaryButtonLabel: "Learn more about us",
      secondaryButtonUrl: "/",
      subtitle:
        "Max 250 chars please. A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity. A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity. A leading global city of enterprise",
      title: "Hi I am a ministry’s title keep it under 50 please",
      type: "hero",
      variant: "largeImage",
    },
  }),
}

export const HeroFloating: Story = {
  // The full page exceeds Chromatic's capture pixel limit at 320px wide.
  parameters: { chromatic: chromaticWithoutMobileSmall },
  args: generateArgs({
    heroProps: {
      backgroundUrl: "/hero-banner.png",
      buttonLabel: "Explore now",
      buttonUrl: "/",
      secondaryButtonLabel: "Explore now",
      secondaryButtonUrl: "/",
      subtitle:
        "Empowering the next generation to lead with courage, creativity, and community spirit. Today's youth are shaping tomorrow’s world — and the future looks bright.",
      title: "Youths, the future of our nation",
      type: "hero",
      variant: "floating",
    },
  }),
}

export const HeroFloatingShortText: Story = {
  args: generateArgs({
    heroProps: {
      backgroundUrl: "/hero-banner.png",
      buttonLabel: "Explore now",
      buttonUrl: "/",
      secondaryButtonLabel: "Explore now",
      secondaryButtonUrl: "/",
      subtitle: "Is Still Full Width",
      title: "Short",
      type: "hero",
      variant: "floating",
    },
  }),
}

export const HeroSearchbar: Story = {
  args: generateArgs({
    heroProps: {
      subtitle:
        "APEX connects agencies and the public through a single, secure hub for Singapore’s government APIs.",
      title: "Temasek Polytechnic",
      type: "hero",
      variant: "searchbar",
    },
  }),
}

export const HeroSearchbarWithImage: Story = {
  args: generateArgs({
    heroProps: {
      backgroundUrl: "/hero-banner.png",
      subtitle:
        "APEX connects agencies and the public through a single, secure hub for Singapore’s government APIs.",
      title: "Temasek Polytechnic",
      type: "hero",
      variant: "searchbar",
    },
  }),
}
