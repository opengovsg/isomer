export type ValueOf<T> = T[keyof T]

export type IsTypeEqual<T, U> = [Required<T>] extends [Required<U>]
  ? [Required<U>] extends [Required<T>]
    ? true
    : false
  : false

// This is the Next.js Link component that resembles the HTML anchor tag
export type LinkComponentType = any

// This is the Next.js Script component that resembles the HTML anchor tag
export type ScriptComponentType = any
