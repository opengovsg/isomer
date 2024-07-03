import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import type { PaginationProps } from "../../../types/Pagination";
import Pagination from "./Pagination";

// Template for stories
const Template = (props: Omit<PaginationProps, "currPage" | "setCurrPage">) => {
  const [currPage, setCurrPage] = useState<number>(1);
  return (
    <Pagination {...props} currPage={currPage} setCurrPage={setCurrPage} />
  );
};

const meta: Meta<PaginationProps> = {
  title: "Next/Internal Components/Pagination",
  component: Pagination,
  argTypes: {},
  render: Template,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
};
export default meta;
type Story = StoryObj<typeof Pagination>;

export const SinglePage: Story = {
  args: {
    totalItems: 5,
    itemsPerPage: 6,
  },
};

export const SomePages: Story = {
  args: {
    totalItems: 26,
    itemsPerPage: 6,
  },
};

export const ManyPages: Story = {
  args: {
    totalItems: 1240,
    itemsPerPage: 6,
  },
};
