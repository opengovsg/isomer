import { IconType } from "react-icons"
import { BiRightArrowAlt } from "react-icons/bi"

// TODO: refactor to another file when more components need to use this
export const SUPPORTED_ICON_NAMES = ["right-arrow"] as const
export type SupportedIconName = (typeof SUPPORTED_ICON_NAMES)[number]
// TODO: use union types to support more icon libraries apart from react-icons
export type SupportedIconType = IconType
export const SUPPORTED_ICONS_MAP: Record<SupportedIconName, SupportedIconType> =
  {
    "right-arrow": BiRightArrowAlt,
  }

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
