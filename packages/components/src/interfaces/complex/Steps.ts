import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { NON_EMPTY_STRING_REGEX } from "~/utils/validation"

import { StepsProseSchema } from "../native/Prose"
import { AltTextSchema, generateImageSrcSchema } from "./Image"

export const STEP_TYPE = {
  step: "step",
  or: "or",
  and: "and",
} as const

const StepItemSchema = Type.Object(
  {
    stepType: Type.Union(
      [
        Type.Literal("step", { title: "New step" }),
        Type.Literal("or", { title: "Or" }),
        Type.Literal("and", { title: "And" }),
      ],
      { title: "Step type", default: "step" },
    ),
    instruction: Type.String({
      title: "Instruction",
      pattern: NON_EMPTY_STRING_REGEX,
      errorMessage: { pattern: "cannot be empty or contain only spaces" },
    }),
    description: Type.Optional(StepsProseSchema),
    imageSrc: Type.Optional(
      generateImageSrcSchema({ title: "Image (optional)" }),
    ),
    imageAlt: Type.Optional(AltTextSchema),
  },
  { title: "Step" },
)

export const StepsSchema = Type.Object(
  {
    type: Type.Literal("steps", { default: "steps" }),
    title: Type.Optional(
      Type.String({
        title: "Title",
      }),
    ),
    description: Type.Optional(
      Type.String({
        title: "Description",
        format: "textarea",
      }),
    ),
    steps: Type.Array(StepItemSchema, {
      title: "Steps",
      minItems: 1,
      maxItems: 10,
    }),
  },
  { title: "Steps" },
)

export type StepsProps = Static<typeof StepsSchema> & {
  site: IsomerSiteProps
}
