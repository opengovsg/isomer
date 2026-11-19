import type { ElementType } from "react"
import type { Tagged } from "type-fest"

export type ValueOf<T> = T[keyof T]

// This is a branded type for a formatted date string using getFormattedDate
export type FormattedDate = Tagged<string, "FormattedDate">

// A component that renders like <script> (e.g. next/script); RenderApplicationScripts defaults to "script"
export type ScriptComponentType = ElementType
