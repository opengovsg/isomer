import { IconType } from "react-icons"
import { BiRightArrowAlt } from "react-icons/bi"
import { NextButtonColorVariant } from "~/next/components/Button/Button"

// TODO: refactor to another file when more components need to use this
export const SUPPORTED_ICON_NAMES = ["right-arrow"] as const
export type SupportedIconName = (typeof SUPPORTED_ICON_NAMES)[number]
// TODO: use union types to support more icon libraries apart from react-icons
export type SupportedIconType = IconType
export const SUPPORTED_ICONS_MAP: Record<SupportedIconName, SupportedIconType> =
  {
    "right-arrow": BiRightArrowAlt,
  }

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
