import DOMPurify from "isomorphic-dompurify"

import { isExternalUrl } from "./isExternalUrl"

// Sanitize content to only allow paragraph marks and inline elements, and
// to remove any potentially harmful content
export const getSanitizedInlineContent = (content: string) => {
  DOMPurify.addHook("beforeSanitizeElements", (curr) => {
    // Add rel="noopener noreferrer nofollow" to all anchor tags and
    // open them in a new tab, if they point to an external site
    if (curr.tagName !== "A") {
      return curr
    }

    const href = curr.getAttribute("href")
    if (href && isExternalUrl(href)) {
      curr.setAttribute("rel", "noopener noreferrer nofollow")
      curr.setAttribute("target", "_blank")
    }

    return curr
  })

  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      "b", // bold
      "strong", // bold
      "i", // italic
      "em", // italic
      "u", // underline
      "s", // strikethrough
      "del", // strikethrough
      "strike", // strikethrough
      "sub", // subscript
      "sup", // superscript
      "a", // anchor
      "br", // line break
      "code", // code
    ],
    ALLOWED_ATTR: ["href", "rel", "target"],
  })

  return sanitizedContent
}
