import DOMPurify from "isomorphic-dompurify"

// Sanitize iframe embeds to remove any potentially harmful attributes
// and to insert the iframe title for accessibility
export const getSanitizedIframeWithTitle = (content: string, title: string) => {
  DOMPurify.addHook("beforeSanitizeElements", (curr) => {
    const el = curr as Element

    if (el.tagName !== "IFRAME") {
      return el
    }

    // Add title attribute to iframe elements for accessibility
    el.setAttribute("title", title)
    el.setAttribute("height", "100%")
    el.setAttribute("width", "100%")
    el.setAttribute("class", "absolute top-0 left-0 bottom-0 right-0")
  })

  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ["iframe"],
    ALLOWED_ATTR: [
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
    ],
    RETURN_DOM_FRAGMENT: true,
  }).firstChild as HTMLIFrameElement
}
