import DOMPurify from "isomorphic-dompurify"

// Sanitize iframe embeds to remove any potentially harmful attributes
// and to insert the iframe title for accessibility
export const getSanitizedIframeWithTitle = (content: string, title: string) => {
  const iframe = DOMPurify.sanitize(content, {
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

  iframe.setAttribute("title", title)
  iframe.setAttribute("height", "100%")
  iframe.setAttribute("width", "100%")
  iframe.setAttribute("class", "absolute top-0 left-0 bottom-0 right-0")

  return iframe
}
