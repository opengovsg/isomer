import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { LinkComponentType } from "~/types"
import { FORMSG_EMBED_URL_PATTERN } from "~/utils/validation"

export const FormSGSchema = Type.Object(
  {
    type: Type.Literal("formsg", { default: "formsg" }),
    url: Type.String({
      title: "Form to embed",
      pattern: FORMSG_EMBED_URL_PATTERN,
      format: "embed",
    }),
    title: Type.String({
      title: "Describe your form",
      description:
        "This isn’t displayed anywhere, but can be read by screen readers",
      maxLength: 100,
      default: "A feedback collection form",
    }),
  },
  {
    title: "FormSG component",
    description:
      "The FormSG component is used to embed a FormSG form within the current page.",
  },
)

export type FormSGProps = Static<typeof FormSGSchema> & {
  LinkComponent?: LinkComponentType
}
