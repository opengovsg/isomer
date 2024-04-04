import type { StoryFn, Meta } from "@storybook/react"
import Accordion from "./Accordion"
import type { AccordionProps } from "~/common"

export default {
  title: "Next/Components/Accordion",
  component: Accordion,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<AccordionProps> = (args) => (
  <>
    <Accordion {...args} />
    <Accordion {...args} />
    <Accordion {...args} />
  </>
)

export const Basic = Template.bind({})
Basic.args = {
  summary: "Title for accordion item",
  details: [
    "Enter content for the accordion here. Accordions hide content by default, so make sure that anything written inside an accordion is not critical information.",
  ],
}

export const LongContent = Template.bind({})
LongContent.args = {
  summary:
    "What if I am subject to payment from the Central Repository of Funds but I haven't received the funds yet? What happens then? What if I am subject to payment from the Central Repository of Funds but I haven't received the funds yet? What happens then?",
  details: [
    "Enter content for the accordion here.",
    "Accordions hide content by default, so make sure that anything written inside an accordion is not critical information.",
    {
      type: "unorderedlist",
      items: [
        "This is a bullet point",
        "This is another bullet point",
        "This is a third bullet point",
      ],
    },
  ],
}

export const WithImage = Template.bind({})
WithImage.args = {
  summary: "Title for accordion item with image",
  details: [
    "This accordion contains an image.",
    {
      type: "image",
      src: "https://placehold.co/200x80",
      alt: "Placeholder image",
    },
  ],
}
