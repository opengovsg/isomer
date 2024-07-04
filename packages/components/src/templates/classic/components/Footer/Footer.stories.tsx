import type { Meta, StoryObj } from "@storybook/react";

import Footer from "./Footer";

const meta: Meta<typeof Footer> = {
  title: "Classic/Components/Footer",
  component: Footer,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
};
export default meta;
type Story = StoryObj<typeof Footer>;

// Default scenario
export const Default: Story = {
  args: {
    agencyName: "Isomer Next",
    lastUpdated: "2024-01-28",
    // TODO: Type mismatch
    // @ts-expect-error type mismatch
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
  },
};
