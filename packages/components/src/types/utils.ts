import type { Tagged } from "type-fest"

export type ValueOf<T> = T[keyof T]

// This is a branded type for a formatted date string using getFormattedDate
export type FormattedDate = Tagged<string, "FormattedDate">

// This is the Next.js Link component that resembles the HTML anchor tag
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LinkComponentType = any

// This is the Next.js Script component that resembles the HTML anchor tag
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ScriptComponentType = any
