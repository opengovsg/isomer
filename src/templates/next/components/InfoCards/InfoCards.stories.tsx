import { Meta, StoryFn } from "@storybook/react"
import InfoCards from "./InfoCards"
import { InfoCardsProps } from "~/common"

export default {
  title: "Next/Components/InfoCards",
  component: InfoCards,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<InfoCardsProps> = (args) => <InfoCards {...args} />

export const Default = Template.bind({})
Default.args = {
  sectionIdx: 0,
  title:
    "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
  subtitle:
    "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
  variant: "top",
  cards: [
    {
      title: "A yummy, tipsy evening at Duxton",
      text: "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
      imageUrl: "https://picsum.photos/200/300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      buttonUrl: "https://www.google.com",
    },
    {
      title: "A yummy, tipsy evening at Duxton",
      text: "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile. Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile. Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
      imageUrl: "https://picsum.photos/200/300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      buttonUrl: "https://www.google.com",
    },
    {
      title: "A yummy, tipsy evening at Duxton",
      imageUrl: "https://picsum.photos/200/300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      buttonUrl: "https://www.google.com",
    },
    {
      title: "A yummy, tipsy evening at Duxton",
      imageUrl: "https://picsum.photos/200/300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      buttonUrl: "https://www.google.com",
    },
  ],
}

export const GrayBackground = Template.bind({})
GrayBackground.args = {
  sectionIdx: 1,
  title:
    "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
  subtitle:
    "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
  variant: "top",
  cards: [
    {
      title: "A yummy, tipsy evening at Duxton",
      text: "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
      imageUrl: "https://picsum.photos/200/300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      buttonUrl: "https://www.google.com",
    },
    {
      title: "A yummy, tipsy evening at Duxton",
      text: "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile. Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile. Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
      imageUrl: "https://picsum.photos/200/300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      buttonUrl: "https://www.google.com",
    },
    {
      title: "A yummy, tipsy evening at Duxton",
      imageUrl: "https://picsum.photos/200/300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      buttonUrl: "https://www.google.com",
    },
    {
      title: "A yummy, tipsy evening at Duxton",
      imageUrl: "https://picsum.photos/200/300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      buttonUrl: "https://www.google.com",
    },
  ],
}

export const Side = Template.bind({})
Side.args = {
  sectionIdx: 0,
  title:
    "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
  subtitle:
    "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
  variant: "side",
  cards: [
    {
      title: "A yummy, tipsy evening at Duxton",
      text: "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
      imageUrl: "https://picsum.photos/200/300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      buttonUrl: "https://www.google.com",
    },
    {
      title: "A yummy, tipsy evening at Duxton",
      text: "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile. Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile. Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
      imageUrl: "https://picsum.photos/200/300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      buttonUrl: "https://www.google.com",
    },
    {
      title: "A yummy, tipsy evening at Duxton",
      imageUrl: "https://picsum.photos/200/300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      buttonUrl: "https://www.google.com",
    },
    {
      title: "A yummy, tipsy evening at Duxton",
      imageUrl: "https://picsum.photos/200/300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      buttonUrl: "https://www.google.com",
    },
  ],
}
