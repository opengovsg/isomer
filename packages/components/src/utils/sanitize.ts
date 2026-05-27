import type { Config } from "dompurify"
import DOMPurify from "dompurify"

// We use `dompurify` (browser-only) rather than `isomorphic-dompurify`.
// Waku forces noExternal: true for all build environments, overriding any
// ssr.external config. This means isomorphic-dompurify's jsdom dependency
// always gets fully bundled; jsdom uses the CJS `__dirname` global which
// doesn't exist in ESM, crashing the Waku SSG phase.
//
// In SSR we skip sanitization entirely — content is validated at the CMS
// level before storage, and XSS can only execute in a browser anyway.

/** Sanitize HTML. SSR: returns input unchanged. */
export const sanitize = (input: string, config?: Config): string => {
  if (typeof window === "undefined") return input
  return DOMPurify.sanitize(input, config) as string
}

/** Strip all HTML tags. */
export const stripAllHtmlTags = (input: string): string =>
  sanitize(input, { ALLOWED_TAGS: [] })

/** Sanitize a URL, blocking dangerous protocols. SSR: returns url unchanged. */
export const sanitizeLinkHref = (url: string): string | undefined => {
  if (typeof window === "undefined") return url
  const frag = DOMPurify.sanitize(`<a href="${url}"></a>`, {
    RETURN_DOM_FRAGMENT: true,
  }) as DocumentFragment
  return frag.firstElementChild?.getAttribute("href") ?? undefined
}

/**
 * Sanitize an iframe embed, injecting accessibility attributes via a hook.
 * SSR: returns null (requires a real DOM to construct HTMLIFrameElement).
 */
export const sanitizeIframe = (
  content: string,
  title: string,
): HTMLIFrameElement | null => {
  if (typeof window === "undefined") return null

  DOMPurify.addHook("beforeSanitizeElements", (curr) => {
    const el = curr as Element
    if (el.tagName !== "IFRAME") return el
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
