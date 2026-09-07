import { REFERENCE_LINK_REGEX } from "@opengovsg/isomer-components"

// This function converts HTML with absolute reference links (something like
// https://studio.isomer.gov.sg/sites/1/pages/[resource:siteId:resourceId]) into
// relative reference links ([resource:siteId:resourceId])
export const getHtmlWithRelativeReferenceLinks = (html: string) =>
  html.replaceAll(
    // oxlint-disable-next-line eslint/require-unicode-regexp -- core cleanup deferred
    new RegExp(
      `href="(?:http|https)://[^[]*/${REFERENCE_LINK_REGEX.source}"`,
      "g",
    ),
    (_, siteId, resourceId) => `href="[resource:${siteId}:${resourceId}]"`,
  )
