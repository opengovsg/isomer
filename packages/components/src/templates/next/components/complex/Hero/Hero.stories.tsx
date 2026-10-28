import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  HERO_BLOCK_IMAGE_POSITION,
  HERO_CAROUSEL_CONTENT_ALIGNMENT,
  HERO_CAROUSEL_LAYOUT,
} from "~/interfaces/complex/Hero"
import {
  SEARCHSG_TEST_CLIENT_ID,
  withSearchSgSetup,
} from "~/stories/decorators"
import { generateSiteConfig } from "~/stories/helpers"

import { withArgosModes } from "@isomer/storybook-config"

import { Hero } from "./Hero"

const meta: Meta<typeof Hero> = {
  title: "Next/Components/Hero",
  component: Hero,
  argTypes: {},
  parameters: {
    argos: withArgosModes(["mobile", "tablet", "desktop"]),
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}

export default meta
type Story = StoryObj<typeof Hero>

export const Gradient: Story = {
  args: {
    headingLevel: 1,
    site: generateSiteConfig(),
    backgroundUrl: "/hero-banner.png",
    title: "Ministry of Trade and Industry",
    subtitle:
      "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
    buttonLabel: "Main CTA",
    buttonUrl: "/",
    secondaryButtonLabel: "Sub CTA",
    secondaryButtonUrl: "/",
    variant: "gradient",
  },
}

export const ColourBlock: Story = {
  args: {
    headingLevel: 1,
    site: generateSiteConfig(),
    backgroundUrl:
      "https://images.unsplash.com/photo-1725652264563-9f8eea4e2995?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Your hero title goes here, please keep it short and sweet",
    subtitle:
      "A test for a long subtitle that will expand the hero banner. What will happen if the text is very very very long?",
    buttonLabel: "Main CTA",
    buttonUrl: "/",
    secondaryButtonLabel: "Sub CTA",
    secondaryButtonUrl: "/",
    variant: "block",
    theme: "default",
  },
}

export const ColourBlockInverse: Story = {
  args: {
    headingLevel: 1,
    site: generateSiteConfig(),
    backgroundUrl:
      "https://images.unsplash.com/photo-1725652264563-9f8eea4e2995?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Your hero title goes here, please keep it short and sweet",
    subtitle:
      "A test for a long subtitle that will expand the hero banner. What will happen if the text is very very very long?",
    buttonLabel: "Main CTA",
    buttonUrl: "/",
    secondaryButtonLabel: "Sub CTA",
    secondaryButtonUrl: "/",
    variant: "block",
    theme: "inverse",
  },
}

const colourBlockImageMatrixArgs = {
  headingLevel: 1,
  site: generateSiteConfig(),
  backgroundUrl: "/hero-block-transparent.png",
  title: "Block hero image position and edge",
  subtitle:
    "Use mobile and tablet viewports to check stack order and curved edges.",
  buttonLabel: "Main CTA",
  buttonUrl: "/",
  variant: "block" as const,
  theme: "default" as const,
}

export const ColourBlockRightStraight: Story = {
  args: {
    ...colourBlockImageMatrixArgs,
    blockImage: { imagePosition: "right", imageEdge: "straight" },
  },
}

export const ColourBlockRightCurved: Story = {
  args: {
    ...colourBlockImageMatrixArgs,
    blockImage: { imagePosition: "right", imageEdge: "curved" },
  },
}

export const ColourBlockLeftStraight: Story = {
  args: {
    ...colourBlockImageMatrixArgs,
    blockImage: { imagePosition: "left", imageEdge: "straight" },
  },
}

export const ColourBlockLeftCurved: Story = {
  args: {
    ...colourBlockImageMatrixArgs,
    blockImage: { imagePosition: "left", imageEdge: "curved" },
  },
}

export const ColourBlockLongWord: Story = {
  args: {
    headingLevel: 1,
    site: generateSiteConfig(),
    backgroundUrl:
      "https://images.unsplash.com/photo-1725652264563-9f8eea4e2995?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "International Accreditation Pronouncements",
    subtitle:
      "A test for a long subtitle that will expand the hero banner. What will happen if the text is very very very long?",
    buttonLabel: "Main CTA",
    buttonUrl: "/",
    secondaryButtonLabel: "Sub CTA",
    secondaryButtonUrl: "/",
    variant: "block",
    theme: "default",
  },
}

export const LargeImage: Story = {
  args: {
    headingLevel: 1,
    site: generateSiteConfig(),
    backgroundUrl:
      "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Your hero title goes here, please keep it short and sweet",
    subtitle:
      "A test for a long subtitle that will expand the hero banner. What will happen if the text is very very very long?",
    buttonLabel: "Main CTA",
    buttonUrl: "/",
    secondaryButtonLabel: "Sub CTA",
    secondaryButtonUrl: "/",
    variant: "largeImage",
  },
}

export const Floating: Story = {
  args: {
    headingLevel: 1,
    site: generateSiteConfig(),
    backgroundUrl:
      "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Youths, the future of our nation",
    subtitle:
      "Empowering the next generation to lead with courage, creativity, and community spirit. Today's youth are shaping tomorrow’s world — and the future looks bright.",
    buttonLabel: "Explore now",
    buttonUrl: "/",
    secondaryButtonLabel: "Explore now",
    secondaryButtonUrl: "/",
    variant: "floating",
  },
}

export const FloatingInverse: Story = {
  args: {
    headingLevel: 1,
    site: generateSiteConfig(),
    backgroundUrl:
      "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Youths, the future of our nation",
    subtitle:
      "Empowering the next generation to lead with courage, creativity, and community spirit. Today's youth are shaping tomorrow’s world — and the future looks bright.",
    buttonLabel: "Explore now",
    buttonUrl: "/",
    secondaryButtonLabel: "Explore now",
    secondaryButtonUrl: "/",
    variant: "floating",
    theme: "inverse",
  },
}

export const FloatingShortText: Story = {
  args: {
    headingLevel: 1,
    site: generateSiteConfig(),
    backgroundUrl:
      "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Short",
    subtitle: "Is Still Full Width",
    buttonLabel: "Explore now",
    buttonUrl: "/",
    secondaryButtonLabel: "Explore now",
    secondaryButtonUrl: "/",
    variant: "floating",
  },
}

export const Searchbar: Story = {
  decorators: [withSearchSgSetup()],
  args: {
    headingLevel: 1,
    site: generateSiteConfig({
      search: {
        type: "searchSG",
        clientId: SEARCHSG_TEST_CLIENT_ID,
      },
    }),
    title: "Temasek Polytechnic",
    subtitle:
      "APEX connects agencies and the public through a single, secure hub for Singapore’s government APIs.",
    variant: "searchbar",
  },
}

export const CarouselBlock: Story = {
  args: {
    headingLevel: 1,
    site: generateSiteConfig(),
    variant: "carousel",
    carousel: {
      layout: HERO_CAROUSEL_LAYOUT.block,
      imagePosition: HERO_BLOCK_IMAGE_POSITION.right,
    },
    slides: [
      {
        backgroundUrl:
          "https://images.unsplash.com/photo-1725652264563-9f8eea4e2995?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "Set up good government websites, fast",
        subtitle:
          "Isomer is a website builder made for government teams. Pick a template, add your content, and publish.",
        buttonLabel: "Get started",
        buttonUrl: "/",
        secondaryButtonLabel: "Learn more",
        secondaryButtonUrl: "/",
      },
      {
        backgroundUrl:
          "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "Built for the public sector",
        subtitle:
          "Meet accessibility, security, and branding requirements out of the box.",
      },
      {
        backgroundUrl:
          "https://images.unsplash.com/photo-1594318142972-1e2ea7487a3e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1740",
        title: "Templates that already meet the bar",
        subtitle:
          "Start from a layout that handles accessibility, security, and branding.",
        buttonLabel: "Browse all website templates",
        buttonUrl: "/",
        secondaryButtonLabel: "Contact the Isomer team",
        secondaryButtonUrl: "/",
      },
      {
        backgroundUrl:
          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: "Publish with confidence",
        subtitle:
          "Preview changes, collaborate with your team, and ship updates when you are ready.",
        buttonLabel: "See how publishing works",
        buttonUrl: "/",
      },
    ],
    theme: "default",
  },
}

export const CarouselBlockImageLeft: Story = {
  args: {
    ...CarouselBlock.args,
    carousel: {
      layout: HERO_CAROUSEL_LAYOUT.block,
      imagePosition: HERO_BLOCK_IMAGE_POSITION.left,
    },
  },
}

export const CarouselGradient: Story = {
  args: {
    ...CarouselBlock.args,
    carousel: {
      layout: HERO_CAROUSEL_LAYOUT.gradient,
      contentAlignment: HERO_CAROUSEL_CONTENT_ALIGNMENT.left,
    },
  },
}

export const CarouselGradientCenter: Story = {
  args: {
    ...CarouselBlock.args,
    carousel: {
      layout: HERO_CAROUSEL_LAYOUT.gradient,
      contentAlignment: HERO_CAROUSEL_CONTENT_ALIGNMENT.center,
    },
  },
}

export const SearchbarWithImage: Story = {
  decorators: [withSearchSgSetup()],
  args: {
    headingLevel: 1,
    site: generateSiteConfig({
      search: {
        type: "searchSG",
        clientId: SEARCHSG_TEST_CLIENT_ID,
      },
    }),

    title: "Temasek Polytechnic",
    subtitle:
      "APEX connects agencies and the public through a single, secure hub for Singapore’s government APIs.",
    backgroundUrl:
      "https://images.unsplash.com/photo-1594318142972-1e2ea7487a3e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1740",
    variant: "searchbar",
  },
}
