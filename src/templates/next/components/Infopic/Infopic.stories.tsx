import { Meta, StoryFn } from "@storybook/react"
import InfoPic from "./Infopic"
import { InfopicProps } from "~/common"

export default {
  title: "Next/Components/Infopic",
  component: InfoPic,
  argTypes: {},
} as Meta

// Template for stories
const Template: StoryFn<InfopicProps> = (args) => <InfoPic {...args} />

// Default scenario
export const SideBySide = Template.bind({})
SideBySide.args = {
  sectionIndex: 0,
  title:
    "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
  description:
    "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
  imageAlt: "alt",
  imageSrc: "https://placehold.co/200x200",
  buttonLabel: "Primary CTA",
  buttonUrl: "https://www.google.com",
}

export const SideBySideRightVariant = Template.bind({})
SideBySideRightVariant.args = {
  sectionIndex: 0,
  isTextOnRight: true,
  title:
    "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
  description:
    "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
  imageAlt: "alt",
  imageSrc: "https://placehold.co/200x200",
  buttonLabel: "Primary CTA",
  buttonUrl: "https://www.google.com",
}

export const SidePart = Template.bind({})
SidePart.args = {
  sectionIndex: 0,
  variant: "side-part",
  title:
    "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
  description:
    "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
  imageAlt: "alt",
  imageSrc: "https://placehold.co/200x200",
  buttonLabel: "Primary CTA",
  buttonUrl: "https://www.google.com",
}

export const SidePartRightVariant = Template.bind({})
SidePartRightVariant.args = {
  sectionIndex: 0,
  variant: "side-part",
  isTextOnRight: true,
  title:
    "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
  description:
    "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
  imageAlt: "alt",
  imageSrc: "https://placehold.co/200x200",
  buttonLabel: "Primary CTA",
  buttonUrl: "https://www.google.com",
}
