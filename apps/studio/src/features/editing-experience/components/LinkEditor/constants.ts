import type { IconType } from "react-icons"
import { BiEnvelopeOpen, BiFile, BiFileBlank, BiLink } from "react-icons/bi"

export const LINK_TYPES = {
  Page: "page",
  External: "external",
  File: "file",
  Email: "email",
} as const

export const LINK_TYPES_MAPPING = {
  [LINK_TYPES.Page]: {
    icon: BiFileBlank,
    label: "Page",
  },
  [LINK_TYPES.External]: {
    icon: BiLink,
    label: "External",
  },
  [LINK_TYPES.File]: {
    icon: BiFile,
    label: "File",
  },
  [LINK_TYPES.Email]: {
    icon: BiEnvelopeOpen,
    label: "Email",
  },
} as const

export type LinkTypes = (typeof LINK_TYPES)[keyof typeof LINK_TYPES]
export type LinkTypeMapping<T extends string = string> = Record<
  T,
  {
    icon: IconType
    label: Capitalize<T>
  }
>
export type LinkTypesWithHrefFormat =
  | typeof LINK_TYPES.File
  | typeof LINK_TYPES.External
