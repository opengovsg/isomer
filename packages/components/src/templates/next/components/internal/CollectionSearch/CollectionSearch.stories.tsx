import type { Meta, StoryFn } from "@storybook/react";
import { useState } from "react";

import type { CollectionSearchProps } from "../../../types/CollectionSearch";
import CollectionSearch from "./CollectionSearch";

export default {
  title: "Next/Internal Components/CollectionSearch",
  component: CollectionSearch,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta;

// Template for stories
const Template: StoryFn<Omit<CollectionSearchProps, "search" | "setSearch">> = (
  args,
) => {
  const [search, setSearch] = useState<string>("");
  return <CollectionSearch search={search} setSearch={setSearch} {...args} />;
};

// Default scenario
export const Default = Template.bind({});
Default.args = {
  placeholder: "Search for a publication",
};
