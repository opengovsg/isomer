import type { IconType } from "react-icons"
import {
  LINK_TYPE_EMAIL,
  LINK_TYPE_EXTERNAL,
  LINK_TYPE_FILE,
  LINK_TYPE_PAGE,
} from "@opengovsg/isomer-components"
import { BiEnvelopeOpen, BiFile, BiFileBlank, BiLink } from "react-icons/bi"

export const LINK_TYPES = {
  [LINK_TYPE_PAGE]: {
    icon: BiFileBlank,
    label: "Page",
  },
  [LINK_TYPE_EXTERNAL]: {
    icon: BiLink,
    label: "External",
  },
  [LINK_TYPE_FILE]: {
    icon: BiFile,
    label: "File",
  },
  [LINK_TYPE_EMAIL]: {
    icon: BiEnvelopeOpen,
    label: "Email",
  },
} as const

export type LinkTypes = keyof typeof LINK_TYPES
export type LinkTypeMapping<T extends string = string> = Record<
  T,
  {
    icon: IconType
    label: Capitalize<T>
  }
>
