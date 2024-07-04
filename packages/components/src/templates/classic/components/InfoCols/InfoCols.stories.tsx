import type { Meta, StoryObj } from "@storybook/react";

import type { InfoColsProps } from "~/interfaces";
import InfoCols from "./InfoCols";

const meta: Meta<InfoColsProps> = {
  title: "Classic/Components/InfoCols",
  component: InfoCols,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
};
export default meta;
type Story = StoryObj<typeof InfoCols>;

// Default in CMS is 3 infoboxes
export const Default: Story = {
  args: {
    sectionIdx: 0,
    title: "Infobar title",
    subtitle: "subtitle",
    buttonLabel: "Button text",
    buttonUrl: "https://google.com",
    infoBoxes: [
      {
        title: "Infobox title",
        description: "Infobox description",
      },
      {
        title: "Infobox title",
        description: "Infobox description",
      },
      {
        title: "Infobox title",
        description: "Infobox description",
      },
    ],
  },
};

export const GrayBackground: Story = {
  args: {
    sectionIdx: 1,
    title: "Infobar title",
    subtitle: "subtitle",
    buttonLabel: "Button text",
    buttonUrl: "https://google.com",
    infoBoxes: [
      {
        title: "Infobox title",
        description: "Infobox description",
      },
      {
        title: "Infobox title",
        description: "Infobox description",
      },
      {
        title: "Infobox title",
        description: "Infobox description",
      },
    ],
  },
};

export const NoButton: Story = {
  args: {
    sectionIdx: 0,
    title: "Infobar title",
    subtitle: "subtitle",
    infoBoxes: [
      {
        title: "Infobox title",
        description: "Infobox description",
      },
      {
        title: "Infobox title",
        description: "Infobox description",
      },
      {
        title: "Infobox title",
        description: "Infobox description",
      },
    ],
  },
};

export const OneInfoBox: Story = {
  args: {
    sectionIdx: 0,
    title: "Infobar title",
    subtitle: "subtitle",
    buttonLabel: "Button text",
    buttonUrl: "https://google.com",
    infoBoxes: [
      {
        title: "Infobox title",
        description: "Infobox description",
      },
    ],
  },
};

export const TwoInfoBoxes: Story = {
  args: {
    sectionIdx: 0,
    title: "Infobar title",
    subtitle: "subtitle",
    buttonLabel: "Button text",
    buttonUrl: "https://google.com",
    infoBoxes: [
      {
        title: "Infobox title",
        description: "Infobox description",
      },
      {
        title: "Infobox title",
        description: "Infobox description",
      },
    ],
  },
};

export const ThreeInfoBoxesLongText: Story = {
  args: {
    sectionIdx: 0,
    title: "Infobar title",
    subtitle: "subtitle",
    buttonLabel: "Button text",
    buttonUrl: "https://google.com",
    infoBoxes: [
      {
        title: "Long title that should wrap to the next line",
        description: "Long description that should wrap to the next line",
      },
      {
        title: "Long title that should wrap to the next line",
        description: "Long description that should wrap to the next line",
      },
      {
        title: "Long title that should wrap to the next line",
        description: "Long description that should wrap to the next line",
      },
    ],
  },
};

export const FourInfoBoxes: Story = {
  args: {
    sectionIdx: 0,
    title: "Infobar title",
    subtitle: "subtitle",
    buttonLabel: "Button text",
    buttonUrl: "https://google.com",
    infoBoxes: [
      {
        title: "Infobox title",
        description: "Infobox description",
      },
      {
        title: "Infobox title",
        description: "Infobox description",
      },
      {
        title: "Infobox title",
        description: "Infobox description",
      },
      {
        title: "Infobox title",
        description: "Infobox description",
      },
    ],
  },
};

export const FourInfoBoxesLongText: Story = {
  args: {
    sectionIdx: 0,
    title: "Infobar title",
    subtitle: "subtitle",
    buttonLabel: "Button text",
    buttonUrl: "https://google.com",
    infoBoxes: [
      {
        title: "Long title that should wrap to the next line",
        description:
          "Long description that should wrap to the next line. Long description that should wrap to the next line",
      },
      {
        title: "Long title that should wrap to the next line",
        description:
          "Long description that should wrap to the next line. Long description that should wrap to the next line",
      },
      {
        title: "Long title that should wrap to the next line",
        description:
          "Long description that should wrap to the next line. Long description that should wrap to the next line",
      },
      {
        title: "Long title that should wrap to the next line",
        description:
          "Long description that should wrap to the next line. Long description that should wrap to the next line",
      },
    ],
  },
};
