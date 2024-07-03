import type { Meta, StoryFn } from "@storybook/react";

import type { FooterProps } from "~/interfaces";
import Footer from "./Footer";

export default {
  title: "Classic/Components/Footer",
  component: Footer,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
} as Meta;

// Template for stories
const Template: StoryFn<FooterProps> = (args) => <Footer {...args} />;

// Default scenario
export const Default = Template.bind({});
Default.args = {
  agencyName: "Isomer Next",
  lastUpdated: "2024-01-28",
  items: [
    {
      title: "Column 1",
      subItems: [
        {
          title: "link",
          link: "",
        },
        {
          title: "long long long long long link",
          link: "",
        },
        {
          title: "link",
          link: "",
        },
      ],
      link: "www.google.com",
    },
    {
      title: "Column 2",
      subItems: [
        {
          title: "link",
          link: "",
        },
        {
          title: "long long long long long link",
          link: "",
        },
        {
          title: "link",
          link: "",
        },
      ],
    },
    {
      title: "Column 3",
      subItems: [
        {
          title: "link",
          link: "",
        },
        {
          title: "long long long long long link",
          link: "",
        },
        {
          title: "link",
          link: "",
        },
      ],
    },
  ],
};
