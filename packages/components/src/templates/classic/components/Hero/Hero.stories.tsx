import type { Meta, StoryObj } from "@storybook/react";

import Hero from "./Hero";

const meta: Meta<typeof Hero> = {
  title: "Classic/Components/Hero",
  component: Hero,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
};
export default meta;
type Story = StoryObj<typeof Hero>;

// Default scenario
export const Default: Story = {
  args: {
    variant: "center",
    backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
    title: "Easily set up good government websites",
    subtitle: "Free, fast, easy",
    buttonLabel: "Find out if I'm a good fit",
    buttonUrl: "/contact",
    keyHighlights: [
      {
        title: "Key highlight 1",
        description: "This is a key highlight",
        url: "/key-highlight-1",
      },
      {
        title: "Key highlight 2",
        description: "This is another key highlight 1",
        url: "/key-highlight-2",
      },
      {
        title: "Key highlight 3",
        description: "This is another key highlight 2",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        title: "Key highlight 4",
        description: "This is another key highlight 3",
        url: "/key-highlight-4",
      },
    ],
  },
};

// Side layout
export const SideButton: Story = {
  args: {
    variant: "side",
    backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
    alignment: "left",
    backgroundColor: "white",
    size: "md",
    title: "Easily set up good government websites",
    subtitle: "Free, fast, easy",
    buttonLabel: "Find out if I'm a good fit",
    buttonUrl: "/contact",
  },
};

export const SideDropdown: Story = {
  args: {
    variant: "side",
    backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
    alignment: "left",
    backgroundColor: "white",
    size: "md",
    title: "Easily set up good government websites",
    subtitle: "Free, fast, easy",
    dropdown: {
      options: [
        {
          title: "Option 1",
          url: "/option-1",
        },
        {
          title: "Option 2",
          url: "/option-2",
        },
        {
          title:
            "Some super long option that it should overflow on small screens",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        },
      ],
    },
  },
};

// Image only layout
export const Image: Story = {
  args: {
    variant: "image",
    backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
  },
};

export const ImageWithDropdown: Story = {
  args: {
    variant: "image",
    backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
    dropdown: {
      options: [
        {
          title: "Option 1",
          url: "/option-1",
        },
        {
          title: "Option 2",
          url: "/option-2",
        },
        {
          title:
            "Some super long option that it should overflow on small screens",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        },
      ],
    },
  },
};

// Floating layout
export const FloatingButton: Story = {
  args: {
    variant: "floating",
    backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
    alignment: "left",
    backgroundColor: "white",
    size: "md",
    title: "Easily set up good government websites",
    subtitle: "Free, fast, easy",
    buttonLabel: "Find out if I'm a good fit",
    buttonUrl: "/contact",
  },
};

export const FloatingDropdown: Story = {
  args: {
    variant: "floating",
    backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
    alignment: "left",
    backgroundColor: "white",
    size: "md",
    title: "Easily set up good government websites",
    subtitle: "Free, fast, easy",
    dropdown: {
      options: [
        {
          title: "Option 1",
          url: "/option-1",
        },
        {
          title: "Option 2",
          url: "/option-2",
        },
        {
          title:
            "Some super long option that it should overflow on small screens",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        },
      ],
    },
  },
};

// Center/Default layout
export const CenterButton: Story = {
  args: {
    variant: "center",
    backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
    title: "Easily set up good government websites",
    subtitle: "Free, fast, easy",
    buttonLabel: "Find out if I'm a good fit",
    buttonUrl: "/contact",
  },
};

export const CenterDropdown: Story = {
  args: {
    variant: "center",
    backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
    title: "Easily set up good government websites",
    subtitle: "Free, fast, easy",
    dropdown: {
      options: [
        {
          title: "Option 1",
          url: "/option-1",
        },
        {
          title: "Option 2",
          url: "/option-2",
        },
        {
          title:
            "Some super long option that it should overflow on small screens",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        },
      ],
    },
  },
};
