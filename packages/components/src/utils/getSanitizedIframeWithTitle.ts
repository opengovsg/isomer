import DOMPurify from "isomorphic-dompurify"

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
  height: "100%",
  width: "100%",
  class: "absolute top-0 left-0 bottom-0 right-0",
} as const

// Sanitize iframe embeds to remove any potentially harmful attributes
// and to insert the minimal accessibility
export const getSanitizedIframeWithTitle = (content: string, title: string) => {
  const sanitizedFragment = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ["iframe"],
    ALLOWED_ATTR: IFRAME_ALLOWED_ATTRIBUTES,
    RETURN_DOM_FRAGMENT: true,
  })

  const iframe = sanitizedFragment.querySelector<HTMLIFrameElement>("iframe")

  if (!iframe) {
    return null
  }

  iframe.setAttribute("title", title)
  iframe.setAttribute("height", IFRAME_LAYOUT_ATTRIBUTES.height)
  iframe.setAttribute("width", IFRAME_LAYOUT_ATTRIBUTES.width)
  iframe.setAttribute("class", IFRAME_LAYOUT_ATTRIBUTES.class)

  return iframe
}
