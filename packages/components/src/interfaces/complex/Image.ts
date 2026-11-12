import type { Static, TOptional } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { IMAGE_ACCEPTED_MIME_TYPE_MAPPING } from "~/constants/image"

import { ARRAY_RADIO_FORMAT } from "../format"
import { IsomerString } from "../primitives/IsomerString"

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

// Engineering RFC 09. Absent means unedited. The bake applies crop to the
// pixels, and crop stays here only so the editor can re-bake from the
// original. Renderers emit focal as object-position. Only the adjustment
// modal writes this, hence format: "hidden".
//
// Making a component's image adjustable takes three steps. Each one has
// shipped broken on its own before.
//   1. Schema. Spread generateAdjustableImageFields("<srcField>") into the
//      component schema. imageAdjustmentSchemaGuardrail.test.ts checks it.
//   2. Render. Add a case to resolveAdjustmentConfig in Studio's
//      adjustmentConfigRegistry.ts. Then pass the adjustment to
//      ImageClientWithAdjustment, or to getFocalObjectPosition for a CSS
//      background, in every render branch.
//   3. Story. Add a story that sets a real adjustment and shows the image
//      shift. imageAdjustmentWiringGuardrail.test.ts checks steps 2 and 3.
// Components that are never adjustable, like LogoCloud and Video, go in
// INTENTIONALLY_NOT_ADJUSTABLE and the schema guardrail's allowlist instead.
export const imageAdjustmentSchema = Type.Object(
  {
    // Fractions of the full original, never of a previous crop. x and y are
    // the top-left corner. validateCropBounds checks x+width and y+height
    // stay within 1 at save time. This schema does not.
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
    originalKey: Type.String(),
  },
  {
    title: "Image adjustment",
    format: "hidden",
  },
)

export type ImageAdjustment = Static<typeof imageAdjustmentSchema>

// Emits an image src field and its `${name}ImageAdjustment` sibling to spread
// into a schema. A per-field key lets one component have two image fields.
// Pass `optional: true` when the image itself is optional, as on Blockquote.
export const generateAdjustableImageFields = <
  TName extends string,
  TOptionalSrc extends boolean = false,
>(
  name: TName,
  opts: {
    title?: string
    description?: string
    allowedMimeTypeMappings?: Record<string, string>
    maxSizeInBytes?: number
    optional?: TOptionalSrc
  } = {},
) => {
  const src = generateImageSrcSchema(opts)
  return {
    [name]: opts.optional ? Type.Optional(src) : src,
    [`${name}ImageAdjustment`]: Type.Optional(imageAdjustmentSchema),
  } as Record<
    TName,
    TOptionalSrc extends true
      ? TOptional<ReturnType<typeof generateImageSrcSchema>>
      : ReturnType<typeof generateImageSrcSchema>
  > &
    Record<`${TName}ImageAdjustment`, TOptional<typeof imageAdjustmentSchema>>
}

// Note: ajv pattern does not support the use of patternFlag like "i" for case-insensitive
// Thus, we manually add the case-insensitive flag to the regex pattern
// Refer to "/altTextRegexPattern.test.ts" for the explanation of the regex pattern
export const ALT_TEXT_REGEX_PATTERN =
  "^(?=.*\\S)(?!(?:[Ii][Mm][Aa][Gg][Ee]|[Pp][Ii][Cc][Tt][Uu][Rr][Ee]|[Pp][Hh][Oo][Tt][Oo]|[Ll][Oo][Gg][Oo]|[Ss][Cc][Rr][Ee][Ee][Nn][Ss][Hh][Oo][Tt]|[Gg][Rr][Aa][Pp][Hh]|[Cc][Hh][Aa][Rr][Tt]|[Dd][Ii][Aa][Gg][Rr][Aa][Mm]|[Ii][Cc][Oo][Nn])$).*$"

export const AltTextSchema = IsomerString({
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
    ...generateAdjustableImageFields("src"),
    alt: AltTextSchema,
    caption: Type.Optional(
      IsomerString({
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
