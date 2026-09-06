export type InlineScriptSerializable =
  | string
  | number
  | boolean
  | Record<string, string | number | boolean | null>
  | null

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
  value: InlineScriptSerializable,
): string => JSON.stringify(value).replaceAll("<", "\\u003c")
