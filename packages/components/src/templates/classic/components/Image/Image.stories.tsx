import type { Meta, StoryFn } from "@storybook/react";

import type { ImageProps } from "~/interfaces";
import Image from "./Image";

export default {
  title: "Classic/Components/Image",
  component: Image,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
} as Meta;

// Template for stories
const Template: StoryFn<ImageProps> = (args) => <Image {...args} />;

// Default scenario
export const Default = Template.bind({});
Default.args = {
  src: "https://placehold.co/200x200",
  alt: "alt",
};

export const HalfWidth = Template.bind({});
HalfWidth.args = {
  src: "https://placehold.co/200x200",
  alt: "alt",
  width: 50,
};

export const ImageWithExternalLink = Template.bind({});
ImageWithExternalLink.args = {
  src: "https://placehold.co/200x200",
  alt: "alt",
  href: "https://www.google.com",
};

export const ImageWithInternalLink = Template.bind({});
ImageWithInternalLink.args = {
  src: "https://placehold.co/200x200",
  alt: "alt",
  href: "/faq",
};
