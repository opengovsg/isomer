import type { IconType } from "react-icons"
import { BiData, BiFile, BiFileBlank } from "react-icons/bi"

import type { ResourceTypesWithIndexPage } from "./types"

export const getIndexPageIcon = (
  type: ResourceTypesWithIndexPage,
): IconType => {
  switch (type) {
    case "collection":
      return BiData
    case "folder":
      return BiFile
    default:
      const _: never = type
      return BiFileBlank
  }
}

export const getIndexPageSubtitle = (
  type: ResourceTypesWithIndexPage,
): string => {
  switch (type) {
    case "collection":
      return "Manage how your Collection looks like and behaves"
    case "folder":
      return "Customise the index page for this folder"
    default:
      const _: never = type
      return ""
  }
}
