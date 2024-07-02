import { SupportedIconName } from "~/common/icons";

// Theme specific config
export const BUTTON_COLOR_SCHEMES = ["black", "white"] as const;
export type ButtonColorScheme = (typeof BUTTON_COLOR_SCHEMES)[number];

export const BUTTON_VARIANTS = ["solid", "outline", "ghost", "link"] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

export const BUTTON_SIZES = ["base", "sm"] as const;
export type ButtonSize = (typeof BUTTON_SIZES)[number];

export interface ButtonProps {
  type: "button";
  label: string;
  href: string;
  colorScheme?: ButtonColorScheme;
  variant?: ButtonVariant;
  size?: ButtonSize;
  rounded?: boolean;
  leftIcon?: SupportedIconName;
  rightIcon?: SupportedIconName;
  LinkComponent?: any;
}
