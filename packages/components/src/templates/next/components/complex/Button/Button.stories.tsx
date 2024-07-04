import type { Meta, StoryObj } from "@storybook/react";

import type { ButtonProps } from "~/interfaces/complex/Button";
import {
  BUTTON_COLOR_SCHEMES,
  BUTTON_VARIANTS,
} from "~/interfaces/complex/Button";
import Button from "./Button";

const meta: Meta<ButtonProps> = {
  title: "Next/Components/Button",
  component: Button,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

// Default scenario
export const Default: Story = {
  args: {
    label: "Work with us",
    href: "/faq",
  },
};

export const WithRightIcon: Story = {
  args: {
    label: "Work with us",
    href: "/faq",
    rightIcon: "right-arrow",
  },
};

export const LongerButtonText: Story = {
  args: {
    label: "slightly longer button text",
    href: "/faq",
  },
};

const Buttons = () => {
  return (
    <div className="flex flex-col items-center gap-4">
      {BUTTON_COLOR_SCHEMES.flatMap((colorScheme) => {
        return (
          <div
            className={`${
              colorScheme === "black" ? "bg-white" : "bg-gray-900"
            } flex w-full flex-row items-center justify-center gap-4 p-10`}
          >
            {BUTTON_VARIANTS.map((variant) => {
              return (
                <Button
                  label="Work with us"
                  href="/faq"
                  colorScheme={colorScheme}
                  variant={variant}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export const ColorsAndVariants: Story = {
  render: () => <Buttons />,
};
