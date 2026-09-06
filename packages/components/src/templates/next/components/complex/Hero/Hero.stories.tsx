import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  SEARCHSG_TEST_CLIENT_ID,
  withSearchSgSetup,
} from "~/stories/decorators"
import { generateSiteConfig } from "~/stories/helpers"

import { withChromaticModes } from "@isomer/storybook-config"

import { Hero } from "./Hero"

const meta: Meta<typeof Hero> = {
  argTypes: {},
  component: Hero,
  parameters: {
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Components/Hero",
}

export default meta
type Story = StoryObj<typeof Hero>

export const Gradient: Story = {
  args: {
    backgroundUrl: "/hero-banner.png",
    buttonLabel: "Main CTA",
    buttonUrl: "/",
    headingLevel: 1,
    secondaryButtonLabel: "Sub CTA",
    secondaryButtonUrl: "/",
    site: generateSiteConfig(),
    subtitle:
      "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
    title: "Ministry of Trade and Industry",
    variant: "gradient",
  },
}

export const ColourBlock: Story = {
  args: {
    backgroundUrl:
      "https://images.unsplash.com/photo-1725652264563-9f8eea4e2995?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    buttonLabel: "Main CTA",
    buttonUrl: "/",
    headingLevel: 1,
    secondaryButtonLabel: "Sub CTA",
    secondaryButtonUrl: "/",
    site: generateSiteConfig(),
    subtitle:
      "A test for a long subtitle that will expand the hero banner. What will happen if the text is very very very long?",
    theme: "default",
    title: "Your hero title goes here, please keep it short and sweet",
    variant: "block",
  },
}

export const ColourBlockInverse: Story = {
  args: {
    backgroundUrl:
      "https://images.unsplash.com/photo-1725652264563-9f8eea4e2995?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    buttonLabel: "Main CTA",
    buttonUrl: "/",
    headingLevel: 1,
    secondaryButtonLabel: "Sub CTA",
    secondaryButtonUrl: "/",
    site: generateSiteConfig(),
    subtitle:
      "A test for a long subtitle that will expand the hero banner. What will happen if the text is very very very long?",
    theme: "inverse",
    title: "Your hero title goes here, please keep it short and sweet",
    variant: "block",
  },
}

export const ColourBlockLongWord: Story = {
  args: {
    backgroundUrl:
      "https://images.unsplash.com/photo-1725652264563-9f8eea4e2995?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    buttonLabel: "Main CTA",
    buttonUrl: "/",
    headingLevel: 1,
    secondaryButtonLabel: "Sub CTA",
    secondaryButtonUrl: "/",
    site: generateSiteConfig(),
    subtitle:
      "A test for a long subtitle that will expand the hero banner. What will happen if the text is very very very long?",
    theme: "default",
    title: "International Accreditation Pronouncements",
    variant: "block",
  },
}

export const LargeImage: Story = {
  args: {
    backgroundUrl:
      "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    buttonLabel: "Main CTA",
    buttonUrl: "/",
    headingLevel: 1,
    secondaryButtonLabel: "Sub CTA",
    secondaryButtonUrl: "/",
    site: generateSiteConfig(),
    subtitle:
      "A test for a long subtitle that will expand the hero banner. What will happen if the text is very very very long?",
    title: "Your hero title goes here, please keep it short and sweet",
    variant: "largeImage",
  },
}

export const Floating: Story = {
  args: {
    backgroundUrl:
      "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    buttonLabel: "Explore now",
    buttonUrl: "/",
    headingLevel: 1,
    secondaryButtonLabel: "Explore now",
    secondaryButtonUrl: "/",
    site: generateSiteConfig(),
    subtitle:
      "Empowering the next generation to lead with courage, creativity, and community spirit. Today's youth are shaping tomorrow’s world — and the future looks bright.",
    title: "Youths, the future of our nation",
    variant: "floating",
  },
}

export const FloatingInverse: Story = {
  args: {
    backgroundUrl:
      "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    buttonLabel: "Explore now",
    buttonUrl: "/",
    headingLevel: 1,
    secondaryButtonLabel: "Explore now",
    secondaryButtonUrl: "/",
    site: generateSiteConfig(),
    subtitle:
      "Empowering the next generation to lead with courage, creativity, and community spirit. Today's youth are shaping tomorrow’s world — and the future looks bright.",
    theme: "inverse",
    title: "Youths, the future of our nation",
    variant: "floating",
  },
}

export const FloatingShortText: Story = {
  args: {
    backgroundUrl:
      "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    buttonLabel: "Explore now",
    buttonUrl: "/",
    headingLevel: 1,
    secondaryButtonLabel: "Explore now",
    secondaryButtonUrl: "/",
    site: generateSiteConfig(),
    subtitle: "Is Still Full Width",
    title: "Short",
    variant: "floating",
  },
}

export const Searchbar: Story = {
  args: {
    headingLevel: 1,
    site: generateSiteConfig({
      search: {
        clientId: SEARCHSG_TEST_CLIENT_ID,
        type: "searchSG",
      },
    }),
    subtitle:
      "APEX connects agencies and the public through a single, secure hub for Singapore’s government APIs.",
    title: "Temasek Polytechnic",
    variant: "searchbar",
  },
  decorators: [withSearchSgSetup()],
}

export const SearchbarWithImage: Story = {
  args: {
    backgroundUrl:
      "https://images.unsplash.com/photo-1594318142972-1e2ea7487a3e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1740",
    headingLevel: 1,
    site: generateSiteConfig({
      search: {
        clientId: SEARCHSG_TEST_CLIENT_ID,
        type: "searchSG",
      },
    }),
    subtitle:
      "APEX connects agencies and the public through a single, secure hub for Singapore’s government APIs.",
    title: "Temasek Polytechnic",
    variant: "searchbar",
  },
  decorators: [withSearchSgSetup()],
}
