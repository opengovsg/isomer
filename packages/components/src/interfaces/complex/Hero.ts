import type { Static } from "@sinclair/typebox"
import type { Simplify } from "type-fest"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { omit } from "lodash-es"
import { IMAGE_ACCEPTED_MIME_TYPE_MAPPING } from "~/constants/image"
import { LINK_HREF_PATTERN, NON_EMPTY_STRING_REGEX } from "~/utils/validation"

import { ARRAY_RADIO_FORMAT, HERO_BANNER_STYLE_FORMAT } from "../format"
import { IsomerString } from "../primitives/IsomerString"
import { generateImageSrcSchema } from "./Image"

export const HERO_STYLE = {
  gradient: { key: "gradient", title: "Gradient (Default)" },
  block: { key: "block", title: "Block" },
  largeImage: { key: "largeImage", title: "Large image" },
  floating: { key: "floating", title: "Floating" },
  searchbar: { key: "searchbar", title: "Search bar" },
  carousel: { key: "carousel", title: "Carousel" },
} as const

export const HERO_CAROUSEL_STYLE = {
  block: "block",
  gradient: "gradient",
} as const

export type HeroStyleVariant =
  (typeof HERO_STYLE)[keyof typeof HERO_STYLE]["key"]

export function getHeroStyleVariantForBranchTitle(
  branchTitle: string,
): HeroStyleVariant | undefined {
  return Object.values(HERO_STYLE).find(
    (branch) => branch.title === branchTitle,
  )?.key
}

const HeroBaseSchema = Type.Object({
  type: Type.Literal("hero", { default: "hero" }),
  title: IsomerString({
    title: "Hero text",
    description: "The title of the hero banner",
    maxLength: 100,
    pattern: NON_EMPTY_STRING_REGEX,
    errorMessage: {
      pattern: "cannot be empty or contain only spaces",
    },
  }),
  subtitle: Type.Optional(
    IsomerString({
      title: "Description",
      description: "The contents of the hero banner",
      format: "textarea",
      maxLength: 300,
    }),
  ),
})

const CallToActionsSchema = Type.Object({
  buttonLabel: Type.Optional(
    IsomerString({
      title: "Primary Call-to-Action text",
      description:
        "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
    }),
  ),
  buttonUrl: Type.Optional(
    Type.String({
      title: "Button destination",
      description: "When this is clicked, open:",
      format: "link",
      pattern: LINK_HREF_PATTERN,
    }),
  ),
  secondaryButtonLabel: Type.Optional(
    IsomerString({
      title: "Secondary Call-to-Action text",
      description:
        "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
    }),
  ),
  secondaryButtonUrl: Type.Optional(
    Type.String({
      title: "Button destination",
      description: "When this is clicked, open:",
      format: "link",
      pattern: LINK_HREF_PATTERN,
    }),
  ),
})

const BACKGROUND_IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING = omit(
  IMAGE_ACCEPTED_MIME_TYPE_MAPPING,
  ".gif",
)

const BackgroundUrlSchema = generateImageSrcSchema({
  title: "Hero image",
  allowedMimeTypeMappings: BACKGROUND_IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
})

const GROUPINGS = {
  TEXT: {
    label: "Hero content",
    fields: ["title", "subtitle"],
  },
  PRIMARY_CALL_TO_ACTION: {
    label: "Primary Call-to-Action",
    fields: ["buttonLabel", "buttonUrl"],
  },
  SECONDARY_CALL_TO_ACTION: {
    label: "Secondary Call-to-Action",
    fields: ["secondaryButtonLabel", "secondaryButtonUrl"],
  },
} as const

const HeroGradientSchema = Type.Composite(
  [
    Type.Object({
      variant: Type.Literal(HERO_STYLE.gradient.key, {
        default: HERO_STYLE.gradient.key,
      }),
      backgroundUrl: BackgroundUrlSchema,
    }),
    HeroBaseSchema,
    CallToActionsSchema,
  ],
  {
    title: HERO_STYLE.gradient.title,
    groups: [
      GROUPINGS.TEXT,
      GROUPINGS.PRIMARY_CALL_TO_ACTION,
      GROUPINGS.SECONDARY_CALL_TO_ACTION,
    ],
  },
)

const HeroBlockSchema = Type.Composite(
  [
    Type.Object({
      variant: Type.Literal(HERO_STYLE.block.key, {
        default: HERO_STYLE.block.key,
      }),
      backgroundUrl: BackgroundUrlSchema,
    }),
    HeroBaseSchema,
    CallToActionsSchema,
  ],
  {
    title: HERO_STYLE.block.title,
    groups: [
      GROUPINGS.TEXT,
      GROUPINGS.PRIMARY_CALL_TO_ACTION,
      GROUPINGS.SECONDARY_CALL_TO_ACTION,
    ],
  },
)

const HeroLargeImageSchema = Type.Composite(
  [
    Type.Object({
      variant: Type.Literal(HERO_STYLE.largeImage.key, {
        default: HERO_STYLE.largeImage.key,
      }),
      backgroundUrl: BackgroundUrlSchema,
    }),
    HeroBaseSchema,
    CallToActionsSchema,
  ],
  {
    title: HERO_STYLE.largeImage.title,
    groups: [
      GROUPINGS.TEXT,
      GROUPINGS.PRIMARY_CALL_TO_ACTION,
      GROUPINGS.SECONDARY_CALL_TO_ACTION,
    ],
  },
)

const HeroFloatingSchema = Type.Composite(
  [
    Type.Object({
      variant: Type.Literal(HERO_STYLE.floating.key, {
        default: HERO_STYLE.floating.key,
      }),
      backgroundUrl: BackgroundUrlSchema,
    }),
    HeroBaseSchema,
    CallToActionsSchema,
  ],
  {
    title: HERO_STYLE.floating.title,
    groups: [
      GROUPINGS.TEXT,
      GROUPINGS.PRIMARY_CALL_TO_ACTION,
      GROUPINGS.SECONDARY_CALL_TO_ACTION,
    ],
  },
)

const HeroSearchbarSchema = Type.Composite(
  [
    Type.Object({
      variant: Type.Literal(HERO_STYLE.searchbar.key, {
        default: HERO_STYLE.searchbar.key,
      }),
      backgroundUrl: Type.Optional(BackgroundUrlSchema),
    }),
    HeroBaseSchema,
  ],
  {
    title: HERO_STYLE.searchbar.title,
    format: "hidden", // beta: we don't want to show this in the UI yet
    groups: [GROUPINGS.TEXT],
  },
)

const HERO_CAROUSEL_PLACEHOLDER_IMAGE = "/placeholder_no_image.png"
const HERO_CAROUSEL_PLACEHOLDER_TITLE = "Enter a title."

const heroCarouselSlideDefault = {
  backgroundUrl: HERO_CAROUSEL_PLACEHOLDER_IMAGE,
  title: HERO_CAROUSEL_PLACEHOLDER_TITLE,
}

const HeroCarouselSlideSchema = Type.Composite(
  [
    Type.Object({
      backgroundUrl: generateImageSrcSchema({
        title: "Hero image",
        allowedMimeTypeMappings:
          BACKGROUND_IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
        default: HERO_CAROUSEL_PLACEHOLDER_IMAGE,
      }),
    }),
    Type.Omit(HeroBaseSchema, ["type"]),
    CallToActionsSchema,
  ],
  {
    title: "Slide",
    groups: [
      GROUPINGS.TEXT,
      GROUPINGS.PRIMARY_CALL_TO_ACTION,
      GROUPINGS.SECONDARY_CALL_TO_ACTION,
    ],
  },
)

// Composite copies the shared hero title schema. Set the default on this copy
// so other hero variants do not pick it up when switching styles.
HeroCarouselSlideSchema.properties.title.default =
  HERO_CAROUSEL_PLACEHOLDER_TITLE

export const HERO_CAROUSEL_SLIDE_LIMITS = {
  minItems: 2,
  maxItems: 3,
} as const

const HeroCarouselSchema = Type.Object(
  {
    type: Type.Literal("hero", { default: "hero" }),
    variant: Type.Literal(HERO_STYLE.carousel.key, {
      default: HERO_STYLE.carousel.key,
    }),
    style: Type.Union(
      [
        Type.Literal(HERO_CAROUSEL_STYLE.block, {
          title: "Block",
        }),
        Type.Literal(HERO_CAROUSEL_STYLE.gradient, {
          title: "Gradient",
        }),
      ],
      {
        title: "Style",
        default: HERO_CAROUSEL_STYLE.block,
        format: ARRAY_RADIO_FORMAT,
      },
    ),
    slides: Type.Array(HeroCarouselSlideSchema, {
      title: "Slides",
      ...HERO_CAROUSEL_SLIDE_LIMITS,
      default: [heroCarouselSlideDefault, { ...heroCarouselSlideDefault }],
    }),
  },
  {
    title: HERO_STYLE.carousel.title,
  },
)

export const HeroSchema = Type.Intersect(
  [
    Type.Union(
      [
        HeroGradientSchema,
        HeroBlockSchema,
        HeroLargeImageSchema,
        HeroFloatingSchema,
        HeroCarouselSchema,
        HeroSearchbarSchema,
      ],
      {
        title: "Hero banner style",
        format: HERO_BANNER_STYLE_FORMAT,
      },
    ),
  ],
  {
    title: "Hero banner",
  },
)

interface HeroLayoutProps {
  site: IsomerSiteProps
  theme?: "default" | "inverse"
  headingLevel: number
}

type CommonProps = Static<typeof HeroBaseSchema> & HeroLayoutProps

export type HeroGradientProps = Simplify<
  CommonProps & Static<typeof HeroGradientSchema>
>

export type HeroBlockProps = Simplify<
  CommonProps & Static<typeof HeroBlockSchema>
>

export type HeroLargeImageProps = Simplify<
  CommonProps & Static<typeof HeroLargeImageSchema>
>

export type HeroFloatingProps = Simplify<
  CommonProps & Static<typeof HeroFloatingSchema>
>

export type HeroSearchbarProps = Simplify<
  CommonProps & Static<typeof HeroSearchbarSchema>
>

export type HeroCarouselProps = Simplify<
  HeroLayoutProps & Static<typeof HeroCarouselSchema>
>

export type HeroProps =
  | HeroGradientProps
  | HeroBlockProps
  | HeroLargeImageProps
  | HeroFloatingProps
  | HeroSearchbarProps
  | HeroCarouselProps
