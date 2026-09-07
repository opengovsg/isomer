import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
  isNonEmptyArray,
} from "~/utils/truthiness"

/* oxlint-disable eslint/prefer-named-capture-group -- core cleanup deferred */
import type { LinkTypes, LinkTypesWithHrefFormat } from "./constants"
import { LINK_TYPES } from "./constants"

export const parseHref = (href: string, pageType: LinkTypesWithHrefFormat) => {
  // oxlint-disable-next-line typescript/switch-exhaustiveness-check -- core cleanup deferred
  switch (pageType) {
    case LINK_TYPES.File: {
      return href.split("/").pop()
    }
    default: {
      return href
    }
  }
}

export const getLinkHrefType = (href: string | undefined): LinkTypes => {
  if (!hasNonEmptyString(href)) {
    // We default to page if no href is provided, as that is the first option
    return LINK_TYPES.Page
  }

  if (href.startsWith("mailto:")) {
    return LINK_TYPES.Email
  }

  // File links point to the assets bucket: path-only format /(\d+)/<uuid>/<filename>.
  // Never treat full URLs as internal file links (avoids external URLs with this
  // pattern being misclassified and shown as filename-only in the UI).
  let isFullUrl = false
  try {
    const url = new URL(href)
    isFullUrl = url.protocol === "http:" || url.protocol === "https:"
  } catch {
    // Relative path or invalid URL
  }
  if (!isFullUrl) {
    // oxlint-disable-next-line eslint/prefer-named-capture-group -- core cleanup deferred
    const fileLinkMatch = /^\/(\d+)\/[0-9a-fA-F-]{36}\//u.exec(href)
    if (fileLinkMatch?.length === 2) {
      return LINK_TYPES.File
    }
  }

  // Internal links are in the format [resource:$siteId:$pageId]
  // If the href starts with a slash, we consider it an internal page link
  // oxlint-disable-next-line eslint/prefer-named-capture-group -- core cleanup deferred
  // oxlint-disable-next-line eslint/prefer-named-capture-group -- core cleanup deferred
  // oxlint-disable-next-line eslint/require-unicode-regexp -- core cleanup deferred
  const referenceLinkMatch = /\[resource:(\d+):(\d+)\]/.exec(href)
  if (referenceLinkMatch?.length === 3) {
    return LINK_TYPES.Page
  }

  return LINK_TYPES.External
}
