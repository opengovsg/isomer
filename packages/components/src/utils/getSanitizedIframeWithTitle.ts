import { sanitize } from "isomorphic-dompurify"

const IFRAME_ALLOWED_ATTRIBUTES = [
  "src",
  "title",
  "width",
  "height",
  "class",
  "frameborder",
  "allow",
  "allowfullscreen",
  "referrerpolicy",
  "id",
  "scrolling",
  "loading",
  "align",
]

const IFRAME_LAYOUT_ATTRIBUTES = {
  class: "absolute top-0 left-0 bottom-0 right-0",
  height: "100%",
  width: "100%",
} as const

// Sanitize iframe embeds to remove any potentially harmful attributes
// and to insert the minimal accessibility
export const getSanitizedIframeWithTitle = (content: string, title: string) => {
  const sanitizedFragment = sanitize(content, {
    ALLOWED_ATTR: IFRAME_ALLOWED_ATTRIBUTES,
    ALLOWED_TAGS: ["iframe"],
    RETURN_DOM_FRAGMENT: true,
  })

  const iframe = sanitizedFragment.querySelector<HTMLIFrameElement>("iframe")

  if (iframe === null) {
    return null
  }

  iframe.setAttribute("title", title)
  iframe.setAttribute("height", IFRAME_LAYOUT_ATTRIBUTES.height)
  iframe.setAttribute("width", IFRAME_LAYOUT_ATTRIBUTES.width)
  iframe.setAttribute("class", IFRAME_LAYOUT_ATTRIBUTES.class)

  return iframe
}
