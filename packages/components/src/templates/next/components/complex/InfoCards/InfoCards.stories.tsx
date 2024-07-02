import { Meta, StoryFn } from "@storybook/react";

import type { InfoCardsProps } from "~/interfaces";
import InfoCards from "./InfoCards";

export default {
  title: "Next/Components/InfoCards",
  component: InfoCards,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta;

// Template for stories
const Template: StoryFn<InfoCardsProps> = (args) => <InfoCards {...args} />;

export const Default = Template.bind({});
Default.args = {
  sectionIdx: 0,
  title:
    "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
  subtitle:
    "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
  variant: "top",
  cards: [
    {
      title:
        "Testing for a card with a long line length that spans across two lines or more",
      description:
        "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
      imageUrl: "https://placehold.co/200x300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      url: "https://www.google.com",
    },
    {
      title: "Card with short title",
      description:
        "In the labyrinthine expanse of Zandoria, an enigmatic government wields authority through a web of intricate bureaucracy and omnipresent surveillance, shaping the lives of its denizens with meticulous precision and unyielding control.",
      imageUrl: "https://placehold.co/200x300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      url: "/",
    },
    {
      title: "Committee of Supply (COS) 2024",
      description:
        "In the kingdom of Veridonia, the government operates as a benevolent monarchy, guided by ancient traditions and the wisdom of its sovereign. Its policies prioritize the welfare of its subjects, fostering prosperity and unity throughout the realm.",
      imageUrl: "https://placehold.co/200x300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      url: "https://www.google.com",
    },
    {
      title: "A yummy, tipsy evening at Duxton",
      imageUrl: "https://placehold.co/200x300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      url: "https://www.google.com",
    },
  ],
};

export const GrayBackground = Template.bind({});
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
      description:
        "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
      imageUrl: "https://placehold.co/200x300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      url: "https://www.google.com",
    },
    {
      title: "A yummy, tipsy evening at Duxton",
      description:
        "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile. Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile. Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
      imageUrl: "https://placehold.co/200x300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      url: "/",
    },
    {
      title: "A yummy, tipsy evening at Duxton",
      imageUrl: "https://placehold.co/200x300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      url: "https://www.google.com",
    },
    {
      title: "A yummy, tipsy evening at Duxton",
      imageUrl: "https://placehold.co/200x300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      url: "https://www.google.com",
    },
  ],
};

export const Side = Template.bind({});
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
      description:
        "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
      imageUrl: "https://placehold.co/200x300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      url: "https://www.google.com",
    },
    {
      title: "A yummy, tipsy evening at Duxton",
      description:
        "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile. Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile. Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
      imageUrl: "https://placehold.co/200x300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      url: "/",
    },
    {
      title: "A yummy, tipsy evening at Duxton",
      imageUrl: "https://placehold.co/200x300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      url: "https://www.google.com",
    },
    {
      title: "A yummy, tipsy evening at Duxton",
      imageUrl: "https://placehold.co/200x300",
      imageAlt: "alt text",
      buttonLabel: "Explore with us",
      url: "https://www.google.com",
    },
  ],
};
