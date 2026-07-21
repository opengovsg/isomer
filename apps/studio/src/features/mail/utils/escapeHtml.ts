import { escape, unescape } from "lodash-es"

// Escapes HTML special characters in a string to prevent potential XSS attacks.
export const escapeHtml = (value: string | undefined): string =>
  escape(value ?? "")

// Reverses escapeHtml, for values that need to leave an HTML context (e.g. an email subject).
export const unescapeHtml = (value: string): string => unescape(value)
