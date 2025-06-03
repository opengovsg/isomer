import { REFERENCE_LINK_REGEX } from "@opengovsg/isomer-components"

export const dataAttr = (value: unknown) => (!!value ? true : undefined)

// This function converts HTML with absolute reference links (something like
// https://studio.isomer.gov.sg/sites/1/pages/[resource:siteId:resourceId]) into
// relative reference links ([resource:siteId:resourceId])
export const getHtmlWithRelativeReferenceLinks = (html: string) =>
  html.replaceAll(
    new RegExp(
      `href="(?:http|https):\/\/[^[]*\/${REFERENCE_LINK_REGEX.source}"`,
      "g",
    ),
    (_, siteId, resourceId) => {
      return `href="[resource:${siteId}:${resourceId}]"`
    },
  )
