import type { Meta, StoryFn } from "@storybook/react";
import { useState } from "react";

import type { PaginationProps } from "../../../types/Pagination";
import Pagination from "./Pagination";

export default {
  title: "Next/Internal Components/Pagination",
  component: Pagination,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta;

// Template for stories
const Template: StoryFn<Omit<PaginationProps, "currPage" | "setCurrPage">> = (
  args,
) => {
  const [currPage, setCurrPage] = useState<number>(1);
  return <Pagination currPage={currPage} setCurrPage={setCurrPage} {...args} />;
};

export const SinglePage = Template.bind({});
SinglePage.args = {
  totalItems: 5,
  itemsPerPage: 6,
};

export const SomePages = Template.bind({});
SomePages.args = {
  totalItems: 26,
  itemsPerPage: 6,
};

export const ManyPages = Template.bind({});
ManyPages.args = {
  totalItems: 1240,
  itemsPerPage: 6,
};
