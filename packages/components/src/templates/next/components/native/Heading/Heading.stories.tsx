import { Meta, StoryObj } from "@storybook/react";

import type { HeadingProps } from "~/interfaces";
import { HeadingLevels } from "~/interfaces/native/Heading";
import Heading from "./Heading";

export default {
  title: "Next/Components/Heading",
  component: Heading,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta;

// Template for stories

const Headings = () => {
  return (
    <div>
      {HeadingLevels.map((level) => {
        return (
          <div className="mb-4">
            <Heading
              id={Math.random().toString()}
              level={level}
              content={[{ type: "text", text: `This is a heading-${level}` }]}
            />
          </div>
        );
      })}
    </div>
  );
};

export const ColorsAndVariants: StoryObj<HeadingProps> = {
  render: () => <Headings />,
};
