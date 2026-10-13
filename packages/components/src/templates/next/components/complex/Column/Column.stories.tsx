import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ColumnProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"

import { withChromaticModes } from "@isomer/storybook-config"

import { Column } from "./Column"

const meta: Meta<ColumnProps> = {
  title: "Next/Components/Column",
  component: Column,
  argTypes: {},
  parameters: {
    layout: "fullscreen",
    chromatic: withChromaticModes(["desktop", "mobile"]),
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    site: generateSiteConfig(),
    layout: "content",
    permalink: "/",
    headingLevel: 2,
  },
}
export default meta
type Story = StoryObj<typeof Column>

const image: ColumnProps["columns"][number][number] = {
  type: "image",
  src: "https://placehold.co/600x400",
  alt: "Flowchart of the eligibility criteria",
}

const text: ColumnProps["columns"][number][number] = {
  type: "prose",
  content: [
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Check your eligibility" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Singapore-registered companies, societies and charities can apply. Sole proprietors should apply under the individual track. Follow the chart to check which scheme applies to you before you start your application.",
        },
      ],
    },
  ],
}

const callToAction: ColumnProps["columns"][number][number] = {
  type: "infobar",
  title: "Ready to apply?",
  description: "Applications close on 31 December.",
  buttonLabel: "Start your application",
  buttonUrl: "/",
}

const quote: ColumnProps["columns"][number][number] = {
  type: "blockquote",
  quote:
    "The grant let us hire two more engineers in our first year. We would not have grown this fast without it.",
  source: "Tan Mei Ling, Founder of Acme Robotics",
}

export const ImageAndText: Story = {
  args: {
    variant: "oneThirdTwoThirds",
    columns: [[image], [text]],
  },
}

export const TextAndImage: Story = {
  args: {
    variant: "twoThirdsOneThird",
    columns: [[text], [image]],
  },
}

export const TwoEqual: Story = {
  args: {
    variant: "twoEqual",
    columns: [[text], [callToAction]],
  },
}

export const ThreeEqualOnHomepage: Story = {
  args: {
    layout: "homepage",
    variant: "threeEqual",
    columns: [[image], [text], [quote]],
  },
}

export const EmptyColumn: Story = {
  args: {
    variant: "twoEqual",
    columns: [[text], []],
  },
}

export const CallToActionBesideText: Story = {
  args: {
    variant: "twoThirdsOneThird",
    columns: [[text], [callToAction]],
  },
}

export const CallToActionOnHomepage: Story = {
  args: {
    layout: "homepage",
    variant: "twoEqual",
    columns: [[image], [callToAction]],
  },
}

export const QuoteAndCallToAction: Story = {
  args: {
    variant: "twoEqual",
    columns: [[quote], [callToAction]],
  },
}
