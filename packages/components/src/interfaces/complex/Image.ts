import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { IMAGE_ACCEPTED_MIME_TYPE_MAPPING } from "~/constants/image"

import { ARRAY_RADIO_FORMAT } from "../format"

export const generateImageSrcSchema = ({
  title = "Image",
  description,
  allowedMimeTypeMappings = IMAGE_ACCEPTED_MIME_TYPE_MAPPING,
  maxSizeInBytes,
}: {
  title?: string
  description?: string
  allowedMimeTypeMappings?: Record<string, string>
  maxSizeInBytes?: number
}) => {
  return Type.String({
    title,
    format: "image",
    description,
    allowedMimeTypeMappings,
    maxSizeInBytes,
  })
}

export const ImageSrcSchema = generateImageSrcSchema({})

// Normalized [0,1] coordinate, shared by crop + focal in imageAdjustment.
const NormalizedUnit = Type.Number({ minimum: 0, maximum: 1 })

// The imageAdjustment sibling object (Engineering RFC 09). Optional per
// image-bearing component; absence = unedited. crop/rotate/flip are baked into
// the rendered pixels and kept only so the editor can re-bake from the original;
// focal is emitted at render time as object-position. Written by the adjustment
// modal, never a hand-edited JSONForms control -> format: "hidden".
export const imageAdjustmentSchema = Type.Object(
  {
    crop: Type.Object({
      x: NormalizedUnit,
      y: NormalizedUnit,
      width: NormalizedUnit,
      height: NormalizedUnit,
    }),
    focal: Type.Object({
      x: NormalizedUnit,
      y: NormalizedUnit,
    }),
    rotate: Type.Union(
      [Type.Literal(0), Type.Literal(90), Type.Literal(180), Type.Literal(270)],
      { default: 0 },
    ),
    flipH: Type.Boolean({ default: false }),
    flipV: Type.Boolean({ default: false }),
    originalKey: Type.String(),
  },
  {
    title: "Image adjustment",
    format: "hidden",
  },
)

export type ImageAdjustment = Static<typeof imageAdjustmentSchema>

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
    title: "Image",
  },
)

export type ImageProps = Static<typeof ImageSchema> & {
  site: IsomerSiteProps
  shouldLazyLoad?: boolean
}
