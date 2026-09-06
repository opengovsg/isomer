import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"
import { FORMSG_EMBED_URL_PATTERN } from "~/utils/validation"

export const FormSGSchema = Type.Object(
  {
    title: Type.String({
      default: "A feedback collection form",
      description:
        "This isn’t displayed anywhere, but can be read by screen readers",
      title: "Describe your form",
    }),
    type: Type.Literal("formsg", { default: "formsg" }),
    url: Type.String({
      format: "embed",
      pattern: FORMSG_EMBED_URL_PATTERN,
      title: "Form to embed",
    }),
  },
  {
    description:
      "The FormSG component is used to embed a FormSG form within the current page.",
    title: "FormSG",
  },
)

export type FormSGProps = Static<typeof FormSGSchema> & {
  shouldLazyLoad?: boolean
}
