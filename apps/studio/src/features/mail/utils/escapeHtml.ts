import { escape } from "lodash-es"

// Escapes HTML special characters in a string to prevent potential XSS attacks.
export const escapeHtml = (value: string | undefined): string =>
  escape(value ?? "")
