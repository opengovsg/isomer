/**
 * Serializes a value for safe embedding in inline `<script>` content.
 *
 * Uses JSON.stringify for proper JS escaping, then replaces `<` so user-controlled
 * data cannot close the surrounding script element (e.g. via `</script>`).
 *
 * DOMPurify is not suitable here — it sanitizes HTML markup, not JavaScript
 * literals inside script bodies.
 */
export const serializeForInlineScript = (
  value: string | number | boolean | object | null,
): string => JSON.stringify(value).replace(/</g, "\\u003c")
