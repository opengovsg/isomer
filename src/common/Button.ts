import { SupportedIconName } from "./Icons"

// Theme specific config
const NEXT_BUTTON_COLORS = ["black", "white"] as const
export type NextButtonColorScheme = (typeof NEXT_BUTTON_COLORS)[number]

// extend this with union types when there are more themes in the future
export type ButtonColorScheme = NextButtonColorScheme

export interface ButtonProps {
  label: string
  href: string
  colorScheme?: ButtonColorScheme
  variant?: "solid" | "outline" | "ghost" | "link"
  rounded?: boolean
  leftIcon?: SupportedIconName
  rightIcon?: SupportedIconName
}

export default ButtonProps
