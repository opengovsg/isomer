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

// The imageAdjustment object (Engineering RFC 09). Optional per image-bearing
// component; absence = unedited. crop is baked into the rendered pixels and
// kept only so the editor can re-bake from the original; focal is emitted at
// render time as object-position. Written by the adjustment modal, never a
// hand-edited JSONForms control -> format: "hidden".
//
// Adding this to a new image-bearing component is 3 layers, and each has
// silently shipped broken on its own before (see HeroGradientQuickLinks and
// the collection thumbnail in git history for real examples):
//   1. Schema: spread `...generateAdjustableImageFields("<srcField>", {...})`
//      into the component schema (see the factory below). It emits the image
//      src field AND a `<srcField>ImageAdjustment` sibling together, so the
//      sibling can't be forgotten or misnamed -- and two image fields on one
//      component get distinct, non-colliding adjustment keys. Covered by
//      imageAdjustmentSchemaGuardrail.test.ts.
//   2. Resolve + render: add a case in Studio's resolveAdjustmentConfig
//      (apps/studio .../ImageAdjustmentModal/adjustmentConfigRegistry.ts),
//      then forward imageAdjustment through to ImageClientWithAdjustment (or
//      getFocalObjectPosition directly for a CSS background-image) in EVERY
//      render branch the component has -- not just the first one you touch.
//      Reference implementation: InfoCardImage.tsx. Covered by
//      imageAdjustmentWiringGuardrail.test.ts, keyed off focalEnabled: true.
//   3. Prove it: add a *.adjustment.stories.tsx (or a story in the
//      component's own stories file) that sets a real imageAdjustment and
//      shows the image visibly shift -- a schema field existing says nothing
//      about whether any render branch honours it. Reference:
//      HeroBlock.adjustment.stories.tsx. Also covered by
//      imageAdjustmentWiringGuardrail.test.ts.
// If a component is deliberately never adjustable (e.g. LogoCloud, Video),
// add it to both INTENTIONALLY_NOT_ADJUSTABLE (adjustmentConfigRegistry.ts)
// and the schema guardrail's own allowlist instead of skipping these steps.
export const imageAdjustmentSchema = Type.Object(
  {
    // Crop box as a fraction of the original image: x/y is the top-left
    // corner, width/height is the box size. All relative to the full
    // original, not to any previous crop -- e.g. {x:0.25, y:0, width:0.5,
    // height:1} keeps the horizontal middle half and the full height.
    // x+width and y+height are each expected to stay within 1 (enforced at
    // save time, not here -- see validateCropBounds in useSaveImageAdjustment.ts).
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

// Emits an image src field and its adjustment sibling as ONE spread-in pair,
// keyed off the field's own name (backgroundUrl -> backgroundUrlImageAdjustment):
//   Type.Object({ ...generateAdjustableImageFields("backgroundUrl", { title }) })
// Naming the sibling after its field (rather than a fixed "imageAdjustment"
// key) means a component with two image fields gets two distinct adjustment
// keys instead of silently colliding on one. The src itself stays a plain
// string, so no stored data changes shape. Images that are never adjustable
// (LogoCloud, Video) keep calling generateImageSrcSchema directly.
//
// Pass `optional: true` when the image field itself may be absent (e.g.
// Blockquote, whose image is optional) -- the src is wrapped in Type.Optional
// and the return type reflects that. The adjustment sibling is always optional
// regardless.
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
