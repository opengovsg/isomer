import { escape, unescape } from "lodash-es"

export const escapeHtml = (value?: string): string => escape(value ?? "")

// Subjects aren't HTML, so undo escaping done by escapeTemplateArguments.
export const unescapeHtml = (value: string): string => unescape(value)
