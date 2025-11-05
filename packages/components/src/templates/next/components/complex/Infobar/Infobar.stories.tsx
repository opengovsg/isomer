import type { Meta, StoryObj } from "@storybook/react-vite"

import type { InfobarProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"
import Infobar from "./Infobar"

const meta: Meta<InfobarProps> = {
  title: "Next/Components/Infobar",
  component: Infobar,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    site: generateSiteConfig(),
  },
}
export default meta
type Story = StoryObj<typeof Infobar>

export const Default: Story = {
  name: "Default",
  args: {
    sectionIdx: 0,
    title: "This is a place where you can put nice content",
    description: "About a sentence worth of description here",
    buttonLabel: "Primary CTA",
    buttonUrl: "/",
    secondaryButtonLabel: "Secondary CTA",
    secondaryButtonUrl: "/",
  },
}

export const DefaultOneButton: Story = {
  name: "Default/One Button",
  args: {
    sectionIdx: 0,
    title: "This is a place where you can put nice content",
    description: "About a sentence worth of description here",
    buttonLabel: "Primary CTA",
    buttonUrl: "/",
  },
}

export const DefaultLongText: Story = {
  name: "Default/Long Text",
  args: {
    sectionIdx: 0,
    title:
      "Longer title here that spans multiple lines and is quite long and verbose and takes up a lot of space",
    description:
      "About a sentence worth of description here About a sentence worth of description here About a sentence worth of description here",
    buttonLabel: "Primary CTA",
    buttonUrl: "/",
    secondaryButtonLabel: "Secondary CTA",
    secondaryButtonUrl: "/",
  },
}

export const DefaultNoCTA: Story = {
  name: "Default/No CTA",
  args: {
    sectionIdx: 0,
    title:
      "Longer title here that spans multiple lines and is quite long and verbose and takes up a lot of space",
    description:
      "About a sentence worth of description here About a sentence worth of description here About a sentence worth of description here",
  },
}

// Should not have dark mode on non-homepage, but putting this here as a test against regression
export const DefaultDark: Story = {
  name: "Default/Dark",
  args: {
    ...Default.args,
    variant: "dark",
  },
}

export const Homepage: Story = {
  name: "Homepage",
  args: {
    layout: "homepage",
    sectionIdx: 0,
    title: "This is a place where you can put nice content",
    description: "About a sentence worth of description here",
    buttonLabel: "Primary CTA",
    buttonUrl: "/",
    secondaryButtonLabel: "Secondary CTA",
    secondaryButtonUrl: "/",
  },
}

export const HomepageOneButton: Story = {
  name: "Homepage/One Button",
  args: {
    layout: "homepage",
    sectionIdx: 0,
    title: "This is a place where you can put nice content",
    description: "About a sentence worth of description here",
    buttonLabel: "Primary CTA",
    buttonUrl: "/",
  },
}

export const HomepageNoCTA: Story = {
  name: "Homepage/No CTA",
  args: {
    layout: "homepage",
    sectionIdx: 0,
    title:
      "Longer title here that spans multiple lines and is quite long and verbose and takes up a lot of space",
    description:
      "About a sentence worth of description here About a sentence worth of description here About a sentence worth of description here",
  },
}

export const HomepageDark: Story = {
  name: "Homepage/Dark",
  args: {
    ...Homepage.args,
    variant: "dark",
  },
}
