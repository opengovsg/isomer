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
