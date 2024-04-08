import type { Meta, StoryFn } from "@storybook/react"
import { useEffect } from "react"
import type { HomePageSchema } from "~/engine"
import Homepage from "./Homepage"

export default {
  title: "Next/Layouts/Homepage",
  component: Homepage,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<HomePageSchema> = (args) => {
  const TEST_CLIENT_ID = "7946e346-993e-41c7-bd81-26a3999dc3f4"

  // Note: This is needed because the script tag is not rendered in the storybook
  useEffect(() => {
    const scriptTag = document.createElement("script")
    scriptTag.src = `https://api.search.gov.sg/v1/searchconfig.js?clientId=${TEST_CLIENT_ID}`
    scriptTag.setAttribute("defer", "")
    document.body.appendChild(scriptTag)
  }, [])
  return <Homepage {...args} />
}

export const Default = Template.bind({})
Default.args = {
  layout: "homepage",
  site: {
    siteName: "Isomer Next",
    siteMap: { title: "Home", permalink: "/", children: [] },
    theme: "isomer-next",
    isGovernment: true,
    logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
    navBarItems: [],
    footerItems: {
      privacyStatementLink: "https://www.isomer.gov.sg/privacy",
      termsOfUseLink: "https://www.isomer.gov.sg/terms",
      siteNavItems: [],
    },
    lastUpdated: "1 Jan 2021",
    search: {
      type: "searchSG",
      clientId: "7946e346-993e-41c7-bd81-26a3999dc3f4",
    },
  },
  page: {
    permalink: "/",
    title: "Home page",
    description: "A Next.js starter for Isomer",
  },
  content: [
    {
      type: "hero",
      variant: "gradient",
      alignment: "left",
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
      type: "infopic",
      title:
        "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
      description:
        "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
      imageAlt: "alt",
      imageSrc: "https://placehold.co/200x200",
      buttonLabel: "Primary CTA",
      buttonUrl: "https://www.google.com",
      isTextOnRight: true,
    },
    {
      type: "infocards",
      title:
        "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
      subtitle:
        "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
      variant: "top",
      cards: [
        {
          title: "A yummy, tipsy evening at Duxton",
          url: "https://www.google.com",
          description:
            "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
          imageUrl: "https://placehold.co/200x300",
          imageAlt: "alt text",
          buttonLabel: "Explore with us",
        },
        {
          title: "A yummy, tipsy evening at Duxton",
          url: "https://www.google.com",
          description:
            "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile. Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile. Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
          imageUrl: "https://placehold.co/200x300",
          imageAlt: "alt text",
          buttonLabel: "Explore with us",
        },
        {
          title: "A yummy, tipsy evening at Duxton",
          url: "https://www.google.com",
          imageUrl: "https://placehold.co/200x300",
          imageAlt: "alt text",
          buttonLabel: "Explore with us",
        },
        {
          title: "A yummy, tipsy evening at Duxton",
          url: "https://www.google.com",
          imageUrl: "https://placehold.co/200x300",
          imageAlt: "alt text",
          buttonLabel: "Explore with us",
        },
      ],
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
      variant: "side",
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
}
