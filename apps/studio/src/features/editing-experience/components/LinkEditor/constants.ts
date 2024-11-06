import type { IconType } from "react-icons"
import { BiEnvelopeOpen, BiFile, BiFileBlank, BiLink } from "react-icons/bi"

export const LINK_TYPES = {
  page: {
    icon: BiFileBlank,
    label: "Page",
  },
  external: {
    icon: BiLink,
    label: "External",
  },
  file: {
    icon: BiFile,
    label: "File",
  },
  email: {
    icon: BiEnvelopeOpen,
    label: "Email",
  },
} as const

export type LinkTypes = keyof typeof LINK_TYPES
export type LinkTypeMapping = Record<
  LinkTypes,
  {
    icon: IconType
    label: Capitalize<LinkTypes>
  }
>
