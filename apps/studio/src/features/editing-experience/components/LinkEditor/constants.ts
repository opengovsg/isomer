import type { IconType } from "react-icons"
import { BiEnvelopeOpen, BiFile, BiFileBlank, BiLink } from "react-icons/bi"

export const LINK_TYPE_PAGE = "page"
export const LINK_TYPE_EXTERNAL = "external"
export const LINK_TYPE_FILE = "file"
export const LINK_TYPE_EMAIL = "email"

export const LINK_TYPES: Record<string, { icon: IconType; label: string }> = {
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

export interface LinkValueHistory {
  [LINK_TYPE_PAGE]: string
  [LINK_TYPE_EXTERNAL]: string
  [LINK_TYPE_FILE]: string
  [LINK_TYPE_EMAIL]: string
}

export const INITIAL_LINK_VALUE_HISTORY: LinkValueHistory = {
  [LINK_TYPE_PAGE]: "",
  [LINK_TYPE_EXTERNAL]: "",
  [LINK_TYPE_FILE]: "",
  [LINK_TYPE_EMAIL]: "",
}
