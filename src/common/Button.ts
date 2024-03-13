import { SupportedIconName } from "./Icons"

// Theme specific config
const NEXT_BUTTON_TEXT_COLORS = ["black", "white"] as const
export type NextButtonTextColors = (typeof NEXT_BUTTON_TEXT_COLORS)[number]

// extend this with union types when there are more themes in the future
export type ButtonTextColors = NextButtonTextColors

export interface ButtonProps {
  label: string
  href: string
  textColor?: ButtonTextColors
  clear?: boolean
  outlined?: boolean
  rounded?: boolean
  leftIcon?: SupportedIconName
  rightIcon?: SupportedIconName
}

export default ButtonProps
