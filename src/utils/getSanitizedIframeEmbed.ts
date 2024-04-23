import DOMPurify from "isomorphic-dompurify"

// Sanitize iframe embeds to remove any potentially harmful attributes
// and to insert the iframe title for accessibility
export const getSanitizedIframeWithTitle = (content: string, title: string) => {
  DOMPurify.addHook("beforeSanitizeElements", (curr) => {
    // Add title attribute to iframe elements for accessibility
    if (curr.tagName !== "IFRAME") {
      return curr
    }

    curr.setAttribute("title", title)
    curr.setAttribute("height", "100%")
    curr.setAttribute("width", "100%")
    curr.setAttribute("class", "absolute top-0 left-0 bottom-0 right-0")
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
