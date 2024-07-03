import type { Meta, StoryFn } from "@storybook/react";

import type { NotFoundPageSchema } from "~/engine";
import NotFoundLayout from "./NotFound";

export default {
  title: "Next/Layouts/NotFound",
  component: NotFoundLayout,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta;

// Template for stories
const Template: StoryFn<NotFoundPageSchema> = (args) => (
  <NotFoundLayout {...args} />
);

export const Default = Template.bind({});
Default.args = {
  layout: "notfound",
  site: {
    siteName: "Isomer Next",
    siteMap: {
      title: "Home",
      permalink: "/",
      lastModified: "",
      layout: "homepage",
      summary: "",
      children: [],
    },
    theme: "isomer-next",
    isGovernment: true,
    logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
    navBarItems: [],
    footerItems: {
      privacyStatementLink: "https://www.isomer.gov.sg/privacy",
      termsOfUseLink: "https://www.isomer.gov.sg/terms",
      siteNavItems: [],
    },
    lastUpdated: "1 Jan 2021",
    search: {
      type: "localSearch",
      searchUrl: "/search",
    },
  },
  page: {
    title: "Search",
    description: "Search results",
    permalink: "/404.html",
    lastModified: "2024-05-02T14:12:57.160Z",
  },
};
