import type { Meta, StoryObj } from "@storybook/react-vite"
import type { InfobarProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"

import { Infobar } from "./Infobar"

const meta: Meta<InfobarProps> = {
  argTypes: {},
  args: {
    headingLevel: 2,
    site: generateSiteConfig(),
  },
  component: Infobar,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Components/Infobar",
}
export default meta
type Story = StoryObj<typeof Infobar>

export const Default: Story = {
  args: {
    buttonLabel: "Primary CTA",
    buttonUrl: "/",
    description: "About a sentence worth of description here",
    secondaryButtonLabel: "Secondary CTA",
    secondaryButtonUrl: "/",
    sectionIdx: 0,
    title: "This is a place where you can put nice content",
  },
  name: "Default",
}

export const DefaultOneButton: Story = {
  args: {
    buttonLabel: "Primary CTA",
    buttonUrl: "/",
    description: "About a sentence worth of description here",
    sectionIdx: 0,
    title: "This is a place where you can put nice content",
  },
  name: "Default/One Button",
}

export const DefaultLongText: Story = {
  args: {
    buttonLabel: "Primary CTA",
    buttonUrl: "/",
    description:
      "About a sentence worth of description here About a sentence worth of description here About a sentence worth of description here",
    secondaryButtonLabel: "Secondary CTA",
    secondaryButtonUrl: "/",
    sectionIdx: 0,
    title:
      "Longer title here that spans multiple lines and is quite long and verbose and takes up a lot of space",
  },
  name: "Default/Long Text",
}

export const DefaultNoCTA: Story = {
  args: {
    description:
      "About a sentence worth of description here About a sentence worth of description here About a sentence worth of description here",
    sectionIdx: 0,
    title:
      "Longer title here that spans multiple lines and is quite long and verbose and takes up a lot of space",
  },
  name: "Default/No CTA",
}

// Should not have dark mode on non-homepage, but putting this here as a test against regression
export const DefaultDark: Story = {
  args: {
    ...Default.args,
    variant: "dark",
  },
  name: "Default/Dark",
}

export const Homepage: Story = {
  args: {
    buttonLabel: "Primary CTA",
    buttonUrl: "/",
    description: "About a sentence worth of description here",
    layout: "homepage",
    secondaryButtonLabel: "Secondary CTA",
    secondaryButtonUrl: "/",
    sectionIdx: 0,
    title: "This is a place where you can put nice content",
  },
  name: "Homepage",
}

export const HomepageOneButton: Story = {
  args: {
    buttonLabel: "Primary CTA",
    buttonUrl: "/",
    description: "About a sentence worth of description here",
    layout: "homepage",
    sectionIdx: 0,
    title: "This is a place where you can put nice content",
  },
  name: "Homepage/One Button",
}

export const HomepageNoCTA: Story = {
  args: {
    description:
      "About a sentence worth of description here About a sentence worth of description here About a sentence worth of description here",
    layout: "homepage",
    sectionIdx: 0,
    title:
      "Longer title here that spans multiple lines and is quite long and verbose and takes up a lot of space",
  },
  name: "Homepage/No CTA",
}

export const HomepageDark: Story = {
  args: {
    ...Homepage.args,
    variant: "dark",
  },
  name: "Homepage/Dark",
}
