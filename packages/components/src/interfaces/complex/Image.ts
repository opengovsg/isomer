import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps } from "~/types"
import { ARRAY_RADIO_FORMAT } from "../format"

export const generateImageSrcSchema = ({
  title = "Image",
  description,
}: {
  title?: string
  description?: string
}) => {
  return Type.String({
    title,
    format: "image",
    description,
  })
}

export const ImageSrcSchema = generateImageSrcSchema({})

// Note: ajv pattern does not support the use of patternFlag like "i" for case-insensitive
// Thus, we manually add the case-insensitive flag to the regex pattern
// Refer to "/altTextRegexPattern.test.ts" for the explanation of the regex pattern
export const ALT_TEXT_REGEX_PATTERN =
  "^(?=.*\\S)(?!(?:[Ii][Mm][Aa][Gg][Ee]|[Pp][Ii][Cc][Tt][Uu][Rr][Ee]|[Pp][Hh][Oo][Tt][Oo]|[Ll][Oo][Gg][Oo]|[Ss][Cc][Rr][Ee][Ee][Nn][Ss][Hh][Oo][Tt]|[Gg][Rr][Aa][Pp][Hh]|[Cc][Hh][Aa][Rr][Tt]|[Dd][Ii][Aa][Gg][Rr][Aa][Mm]|[Ii][Cc][Oo][Nn])$).*$"

export const AltTextSchema = Type.String({
  title: "Alternate text",
  description:
    "Add a descriptive text so that visually impaired users can understand your image",
  pattern: ALT_TEXT_REGEX_PATTERN,
  errorMessage: {
    pattern:
      "must be descriptive. It cannot be empty, contain only spaces, or use generic terms like 'image', 'logo', 'graph', etc.",
  },
})

export const ImageSchema = Type.Object(
  {
    type: Type.Literal("image", { default: "image" }),
    src: ImageSrcSchema,
    alt: AltTextSchema,
    caption: Type.Optional(
      Type.String({
        title: "Caption",
        description:
          "Describe the image or add attributions. To make sure your caption is readable, keep it under 250 characters.",
        format: "textarea",
      }),
    ),
    size: Type.Optional(
      Type.Union(
        [
          Type.Literal("default", { title: "Fill page width (recommended)" }),
          Type.Literal("smaller", { title: "Small" }),
        ],
        {
          title: "Image size",
          description:
            "On mobile, images will always fill up to the page width even if you choose “Small”.",
          format: ARRAY_RADIO_FORMAT,
          type: "string",
          default: "default",
        },
      ),
    ),
  },
  {
    title: "Image component",
  },
)

export type ImageProps = Static<typeof ImageSchema> & {
  site: IsomerSiteProps
  shouldLazyLoad?: boolean
}
