import type { LinkTypesWithHrefFormat } from "~/features/editing-experience/components/LinkEditor/constants"
import { LINK_TYPES } from "~/features/editing-experience/components/LinkEditor/constants"

export const parseHref = (href: string, pageType: LinkTypesWithHrefFormat) => {
  switch (pageType) {
    case LINK_TYPES.File:
      return href.split("/").pop()
    default:
      return href
  }
}
