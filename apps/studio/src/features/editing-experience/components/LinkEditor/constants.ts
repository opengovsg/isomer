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
export type LinkTypeMapping<T extends string = string> = Record<
  T,
  {
    icon: IconType
    label: Capitalize<T>
  }
>

export function filterLinkTypes(
  linkTypes: LinkTypes[] | undefined,
): LinkTypeMapping {
  // default to all link types if no link types are specified
  if (!linkTypes || linkTypes.length === 0) {
    return LINK_TYPES
  }
  return Object.fromEntries(
    Object.entries(LINK_TYPES).filter(([key]) =>
      linkTypes.includes(key as LinkTypes),
    ),
  )
}
