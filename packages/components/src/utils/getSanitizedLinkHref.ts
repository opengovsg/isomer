import DOMPurify from "isomorphic-dompurify"

const ELEMENT_ID = "link-id"

// This function returns a sanitized version of the provided URL string
export const getSanitizedLinkHref = (url?: string) => {
  if (url === undefined) {
    return undefined
  }

  const dirty = document.createElement("a")
  dirty.setAttribute("href", url)
  dirty.setAttribute("id", ELEMENT_ID)
  const clean = DOMPurify.sanitize(dirty, { RETURN_DOM_FRAGMENT: true })

  const sanitizedUrl = clean.getElementById(ELEMENT_ID)?.getAttribute("href")

  if (sanitizedUrl === null) {
    return undefined
  }

  return sanitizedUrl
}
