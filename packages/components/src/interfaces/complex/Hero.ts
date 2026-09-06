import type { Static } from "@sinclair/typebox"
import type { Simplify } from "type-fest"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { omit } from "lodash-es"
import { IMAGE_ACCEPTED_MIME_TYPE_MAPPING } from "~/constants/image"
import { LINK_HREF_PATTERN, NON_EMPTY_STRING_REGEX } from "~/utils/validation"

import { ARRAY_RADIO_FORMAT } from "../format"
import { generateImageSrcSchema } from "./Image"

export const HERO_STYLE = {
  block: "block",
  floating: "floating",
  gradient: "gradient",
  largeImage: "largeImage",
  searchbar: "searchbar",
} as const

const HeroBaseSchema = Type.Object({
  subtitle: Type.Optional(
    Type.String({
      description: "The contents of the hero banner",
      format: "textarea",
      maxLength: 300,
      title: "Description",
    }),
  ),
  title: Type.String({
    description: "The title of the hero banner",
    errorMessage: {
      pattern: "cannot be empty or contain only spaces",
    },
    maxLength: 100,
    pattern: NON_EMPTY_STRING_REGEX,
    title: "Hero text",
  }),
  type: Type.Literal("hero", { default: "hero" }),
})

const CallToActionsSchema = Type.Object({
  buttonLabel: Type.Optional(
    Type.String({
      description:
        "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
      title: "Primary Call-to-Action text",
    }),
  ),
  buttonUrl: Type.Optional(
    Type.String({
      description: "When this is clicked, open:",
      format: "link",
      pattern: LINK_HREF_PATTERN,
      title: "Button destination",
    }),
  ),
  secondaryButtonLabel: Type.Optional(
    Type.String({
      description:
        "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
      title: "Secondary Call-to-Action text",
    }),
  ),
  secondaryButtonUrl: Type.Optional(
    Type.String({
      description: "When this is clicked, open:",
      format: "link",
      pattern: LINK_HREF_PATTERN,
      title: "Button destination",
    }),
  ),
})

const BACKGROUND_IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING = omit(
  IMAGE_ACCEPTED_MIME_TYPE_MAPPING,
  ".gif",
)

const BackgroundUrlSchema = generateImageSrcSchema({
  allowedMimeTypeMappings: BACKGROUND_IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
  title: "Hero image",
})

const GROUPINGS = {
  PRIMARY_CALL_TO_ACTION: {
    fields: ["buttonLabel", "buttonUrl"],
    label: "Primary Call-to-Action",
  },
  SECONDARY_CALL_TO_ACTION: {
    fields: ["secondaryButtonLabel", "secondaryButtonUrl"],
    label: "Secondary Call-to-Action",
  },
  TEXT: {
    fields: ["title", "subtitle"],
    label: "Hero content",
  },
} as const

const HeroGradientSchema = Type.Composite(
  [
    Type.Object({
      backgroundUrl: BackgroundUrlSchema,
      variant: Type.Literal(HERO_STYLE.gradient, {
        default: HERO_STYLE.gradient,
      }),
    }),
    HeroBaseSchema,
    CallToActionsSchema,
  ],
  {
    groups: [
      GROUPINGS.TEXT,
      GROUPINGS.PRIMARY_CALL_TO_ACTION,
      GROUPINGS.SECONDARY_CALL_TO_ACTION,
    ],
    title: "Gradient (Default)",
  },
)

const HeroBlockSchema = Type.Composite(
  [
    Type.Object({
      backgroundUrl: BackgroundUrlSchema,
      variant: Type.Literal(HERO_STYLE.block, { default: HERO_STYLE.block }),
    }),
    HeroBaseSchema,
    CallToActionsSchema,
  ],
  {
    groups: [
      GROUPINGS.TEXT,
      GROUPINGS.PRIMARY_CALL_TO_ACTION,
      GROUPINGS.SECONDARY_CALL_TO_ACTION,
    ],
    title: "Block",
  },
)

const HeroLargeImageSchema = Type.Composite(
  [
    Type.Object({
      backgroundUrl: BackgroundUrlSchema,
      variant: Type.Literal(HERO_STYLE.largeImage, {
        default: HERO_STYLE.largeImage,
      }),
    }),
    HeroBaseSchema,
    CallToActionsSchema,
  ],
  {
    groups: [
      GROUPINGS.TEXT,
      GROUPINGS.PRIMARY_CALL_TO_ACTION,
      GROUPINGS.SECONDARY_CALL_TO_ACTION,
    ],
    title: "Large image",
  },
)

const HeroFloatingSchema = Type.Composite(
  [
    Type.Object({
      backgroundUrl: BackgroundUrlSchema,
      variant: Type.Literal(HERO_STYLE.floating, {
        default: HERO_STYLE.floating,
      }),
    }),
    HeroBaseSchema,
    CallToActionsSchema,
  ],
  {
    groups: [
      GROUPINGS.TEXT,
      GROUPINGS.PRIMARY_CALL_TO_ACTION,
      GROUPINGS.SECONDARY_CALL_TO_ACTION,
    ],
    title: "Floating",
  },
)

const HeroSearchbarSchema = Type.Composite(
  [
    Type.Object({
      backgroundUrl: Type.Optional(BackgroundUrlSchema),
      variant: Type.Literal(HERO_STYLE.searchbar, {
        default: HERO_STYLE.searchbar,
      }),
    }),
    HeroBaseSchema,
  ],
  {
    // beta: we don't want to show this in the UI yet
    format: "hidden",
    groups: [GROUPINGS.TEXT],
    title: "Search bar",
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
        HeroSearchbarSchema,
      ],
      {
        format: ARRAY_RADIO_FORMAT,
        title: "Hero banner style",
      },
    ),
  ],
  {
    title: "Hero banner",
  },
)

type CommonProps = Static<typeof HeroBaseSchema> & {
  site: IsomerSiteProps
  theme?: "default" | "inverse"
  headingLevel: number
}

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

export type HeroProps =
  | HeroGradientProps
  | HeroBlockProps
  | HeroLargeImageProps
  | HeroFloatingProps
  | HeroSearchbarProps
