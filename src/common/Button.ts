import { SupportedIconName } from "./Icons"

// Theme specific config
export const BUTTON_COLOR_SCHEMES = ["black", "white"] as const
export type ButtonColorScheme = (typeof BUTTON_COLOR_SCHEMES)[number]

export const BUTTON_VARIANTS = ["solid", "outline", "ghost", "link"] as const
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number]

export interface ButtonProps {
  label: string
  href: string
  colorScheme?: ButtonColorScheme
  variant?: ButtonVariant
  rounded?: boolean
  leftIcon?: SupportedIconName
  rightIcon?: SupportedIconName
}

export default ButtonProps
