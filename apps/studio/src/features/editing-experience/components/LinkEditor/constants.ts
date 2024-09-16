import type { IconType } from "react-icons"
import { BiEnvelopeOpen, BiFile, BiFileBlank, BiLink } from "react-icons/bi"

export const LINK_TYPES: Record<string, { icon: IconType; label: string }> = {
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
