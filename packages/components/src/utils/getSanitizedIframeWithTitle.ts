import { sanitizeIframe } from "./sanitize"

export const getSanitizedIframeWithTitle = (
  content: string,
  title: string,
): HTMLIFrameElement | null => sanitizeIframe(content, title)
