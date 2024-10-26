import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import {
  IsomerComplexComponentsMap,
  IsomerNativeComponentsMap,
} from "~/schemas/components"

export const IsomerComponentsSchemas = Type.Union([
  ...Object.values(IsomerComplexComponentsMap),
  Type.Ref(IsomerNativeComponentsMap.prose),
])

export type IsomerComponent = Static<typeof IsomerComponentsSchemas>

export type IsomerComponentTypes =
  | keyof typeof IsomerComplexComponentsMap
  | "prose"

export const LINK_TYPE_PAGE = "page"
export const LINK_TYPE_EXTERNAL = "external"
export const LINK_TYPE_FILE = "file"
export const LINK_TYPE_EMAIL = "email"
