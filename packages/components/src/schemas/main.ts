import type { TSchema } from "@sinclair/typebox"

import type { IsomerComponentTypes } from "~/types"
import { IsomerPageSchema } from "~/types"
import {
  IsomerComplexComponentsMap,
  IsomerNativeComponentsMap,
} from "./components"

const definitions = {
  components: {
    complex: IsomerComplexComponentsMap,
    native: IsomerNativeComponentsMap,
  },
}

export const schema: TSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Isomer Next Page JSON",
  ...IsomerPageSchema,
  ...definitions,
}

export const getComponentSchema = (
  component: IsomerComponentTypes,
): TSchema => {
  const componentSchema =
    component === "prose"
      ? IsomerNativeComponentsMap.prose
      : IsomerComplexComponentsMap[component]

  return {
    ...componentSchema,
    ...definitions,
  }
}
