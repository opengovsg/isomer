import type { Meta, StoryFn } from "@storybook/react";

import type { InfopicProps } from "~/interfaces";
import InfoPic from "./Infopic";

export default {
  title: "Classic/Components/Infopic",
  component: InfoPic,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
} as Meta;

// Template for stories
const Template: StoryFn<InfopicProps> = (args) => <InfoPic {...args} />;

// Default scenario
export const Default = Template.bind({});
Default.args = {
  sectionIndex: 0,
  title: "Thank you for attending the roadshows!",
  subtitle: "Coming soon to your hood",
  description: "Catch the highlights from the roadshows here.",
  imageAlt: "alt",
  imageSrc: "https://placehold.co/200x200",
  buttonLabel: "View more resources",
  buttonUrl: "https://www.google.com",
};

export const DefaultGrayBackground = Template.bind({});
DefaultGrayBackground.args = {
  sectionIndex: 1,
  title: "Thank you for attending the roadshows!",
  subtitle: "Coming soon to your hood",
  description: "Catch the highlights from the roadshows here.",
  imageAlt: "alt",
  imageSrc: "https://placehold.co/200x200",
  buttonLabel: "View more resources",
  buttonUrl: "https://www.google.com",
};

export const DefaultRight = Template.bind({});
DefaultRight.args = {
  sectionIndex: 0,
  isTextOnRight: true,
  title: "Thank you for attending the roadshows!",
  subtitle: "Coming soon to your hood",
  description: "Catch the highlights from the roadshows here.",
  imageAlt: "alt",
  imageSrc: "https://placehold.co/200x200",
  buttonLabel: "View more resources",
  buttonUrl: "https://www.google.com",
};

export const TitleAndDescriptionOnly = Template.bind({});
TitleAndDescriptionOnly.args = {
  sectionIndex: 0,
  title: "Thank you for attending the roadshows!",
  description: "Catch the highlights from the roadshows here.",
  imageAlt: "alt",
  imageSrc: "https://placehold.co/200x200",
};

export const InvalidImage = Template.bind({});
InvalidImage.args = {
  sectionIndex: 0,
  title: "Thank you for attending the roadshows!",
  subtitle: "Coming soon to your hood",
  description: "Catch the highlights from the roadshows here.",
  imageAlt: "alt",
  imageSrc: "",
  buttonLabel: "View more resources",
  buttonUrl: "https://www.google.com",
};
