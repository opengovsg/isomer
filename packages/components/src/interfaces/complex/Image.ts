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
// component; absent means unedited. crop is baked into the rendered pixels and
// kept only so the editor can re-bake from the original. focal is emitted at
// render time as object-position. The adjustment modal writes it, never a
// hand-edited JSONForms control, so it uses format: "hidden".
//
// Adding this to a new image-bearing component takes 3 layers. Each has shipped
// silently broken on its own before (HeroGradientQuickLinks and the collection
// thumbnail, both in git history).
//   1. Schema. Spread `...generateAdjustableImageFields("<srcField>", {...})`
//      into the component schema (the factory is below). It emits the src field
//      and its `<srcField>ImageAdjustment` sibling together, so the sibling
//      can't be forgotten or misnamed, and two image fields on one component get
//      distinct, non-colliding keys. Covered by imageAdjustmentSchemaGuardrail.test.ts.
//   2. Resolve and render. Add a case in Studio's resolveAdjustmentConfig
//      (apps/studio .../ImageAdjustmentModal/adjustmentConfigRegistry.ts), then
//      forward imageAdjustment to ImageClientWithAdjustment (or
//      getFocalObjectPosition for a CSS background-image) in every render branch
//      the component has, not just the first. Reference: InfoCardImage.tsx.
//      Covered by imageAdjustmentWiringGuardrail.test.ts, keyed off focalEnabled.
//   3. Prove it. Add a *.adjustment.stories.tsx (or a story in the component's
//      own stories file) that sets a real imageAdjustment and shows the image
//      shift. A schema field existing says nothing about whether a render branch
//      honours it. Reference: HeroBlock.adjustment.stories.tsx, also covered by
//      imageAdjustmentWiringGuardrail.test.ts.
// Components that are never adjustable (LogoCloud, Video) go in both
// INTENTIONALLY_NOT_ADJUSTABLE (adjustmentConfigRegistry.ts) and the schema
// guardrail's allowlist instead of following these steps.
export const imageAdjustmentSchema = Type.Object(
  {
    // Crop box as a fraction of the original image. x/y is the top-left
    // corner, width/height is the box size, all relative to the full original,
    // not to any previous crop. {x:0.25, y:0, width:0.5, height:1} keeps the
    // horizontal middle half and the full height. x+width and y+height should
    // each stay within 1. validateCropBounds in useSaveImageAdjustment.ts
    // enforces that at save time, not here.
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

// Emits an image src field and its adjustment sibling as one spread-in pair,
// keyed off the field's own name (backgroundUrl gives backgroundUrlImageAdjustment):
//   Type.Object({ ...generateAdjustableImageFields("backgroundUrl", { title }) })
// Naming the sibling after its field, rather than a fixed "imageAdjustment" key,
// means a component with two image fields gets two distinct keys instead of
// silently colliding on one. The src stays a plain string, so no stored data
// changes shape. Images that are never adjustable (LogoCloud, Video) keep
// calling generateImageSrcSchema directly.
//
// Pass `optional: true` when the image field itself may be absent (Blockquote,
// for one, has an optional image). The src is then wrapped in Type.Optional and
// the return type reflects it. The adjustment sibling is always optional.
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
