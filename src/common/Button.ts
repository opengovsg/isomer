import { SupportedIconName } from "./Icons"

// Theme specific config
const NEXT_BUTTON_COLOR_VARIANTS = ["black", "white"] as const
export type NextButtonColorVariant = (typeof NEXT_BUTTON_COLOR_VARIANTS)[number]

// extend this with union types when there are more themes in the future
export type ButtonColorVariant = NextButtonColorVariant

export interface ButtonProps {
  label: string
  href: string
  colorVariant?: ButtonColorVariant
  rounded?: boolean
  leftIcon?: SupportedIconName
  rightIcon?: SupportedIconName
}

export default ButtonProps
