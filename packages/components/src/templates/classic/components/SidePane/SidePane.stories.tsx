import type { Meta, StoryFn } from "@storybook/react";

import type { SidePaneProps } from "~/interfaces";
import Sitemap from "../../../../sitemap.json";
import SidePane from "./SidePane";

export default {
  title: "Classic/Components/SidePane",
  component: SidePane,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
} as Meta;

// Template for stories
const Template: StoryFn<SidePaneProps> = (args) => <SidePane {...args} />;

// Default scenario
export const Default = Template.bind({});
Default.args = {
  currentPermalink: "/about-isomer/what-is-isomer/overview/",
  sitemap: Sitemap,
};
