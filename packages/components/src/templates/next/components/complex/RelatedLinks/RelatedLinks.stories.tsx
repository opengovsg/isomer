import type { Meta, StoryObj } from "@storybook/react-vite"
import type { RelatedLinksProps } from "~/interfaces"

import { RelatedLinks } from "./RelatedLinks"

const meta: Meta<RelatedLinksProps> = {
  title: "Next/Components/RelatedLinks",
  component: RelatedLinks,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof RelatedLinks>

export const Default: Story = {
  args: {
    links: [
      {
        title: "How to apply for this scheme",
        url: "/apply",
      },
      {
        title: "Eligibility criteria",
        url: "/eligibility",
      },
      {
        title: "Frequently asked questions",
        url: "/faq",
      },
    ],
  },
}

export const MaxItems: Story = {
  args: {
    heading:
      "Related links with longer heading text to verify wrapping on smaller widths",
    links: [
      {
        title:
          "Step-by-step guide to submit your application for this support scheme",
        url: "/step-by-step-guide",
      },
      {
        title: "Supporting documents checklist",
        url: "/supporting-documents",
      },
      {
        title: "Service standards and expected processing times",
        url: "/service-standards",
      },
      {
        title: "Common application mistakes and how to avoid them",
        url: "/common-mistakes",
      },
      {
        title: "Appeal process for unsuccessful applications",
        url: "/appeals",
      },
      {
        title: "Downloadable forms and templates",
        url: "/downloads",
      },
      {
        title: "Contact details for scheme enquiries",
        url: "/contact",
      },
    ],
  },
}
