import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { LINK_HREF_PATTERN } from "~/utils/validation"
import { ARRAY_RADIO_FORMAT } from "../format"

export const HERO_STYLE = {
  gradient: "gradient",
  block: "block",
  largeImage: "largeImage",
  floating: "floating",
  searchbar: "searchbar",
} as const

const HeroBaseSchema = Type.Object({
  type: Type.Literal("hero", { default: "hero" }),
  title: Type.String({
    title: "Hero text",
    description: "The title of the hero banner",
    maxLength: 100,
  }),
  subtitle: Type.Optional(
    Type.String({
      title: "Description",
      description: "The contents of the hero banner",
      format: "textarea",
      maxLength: 300,
    }),
  ),
  buttonLabel: Type.Optional(
    Type.String({
      title: "Primary call-to-action text",
      description:
        "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
    }),
  ),
  buttonUrl: Type.Optional(
    Type.String({
      title: "Primary call-to-action destination",
      description: "When this is clicked, open:",
      format: "link",
      pattern: LINK_HREF_PATTERN,
    }),
  ),
  secondaryButtonLabel: Type.Optional(
    Type.String({
      title: "Secondary call-to-action text",
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

const HeroBackgroundUrlSchema = Type.String({
  title: "Hero image",
  format: "image",
})

const HeroGradientSchema = Type.Object(
  {
    variant: Type.Literal(HERO_STYLE.gradient, {
      default: HERO_STYLE.gradient,
    }),
    backgroundUrl: HeroBackgroundUrlSchema,
  },
  {
    title: "Gradient (Default)",
  },
)

const HeroBlockSchema = Type.Object(
  {
    variant: Type.Literal(HERO_STYLE.block, { default: HERO_STYLE.block }),
    backgroundUrl: HeroBackgroundUrlSchema,
  },
  {
    title: "Block hero",
  },
)

const HeroLargeImageSchema = Type.Object(
  {
    variant: Type.Literal(HERO_STYLE.largeImage, {
      default: HERO_STYLE.largeImage,
    }),
    backgroundUrl: HeroBackgroundUrlSchema,
  },
  {
    title: "Large image",
  },
)

const HeroFloatingSchema = Type.Object(
  {
    variant: Type.Literal(HERO_STYLE.floating, {
      default: HERO_STYLE.floating,
    }),
    backgroundUrl: HeroBackgroundUrlSchema,
  },
  {
    title: "Floating",
  },
)

const HeroSearchbarSchema = Type.Object(
  {
    variant: Type.Literal(HERO_STYLE.searchbar, {
      default: HERO_STYLE.searchbar,
    }),
    backgroundUrl: Type.Optional(HeroBackgroundUrlSchema),
  },
  {
    title: "Search bar",
    // format: "hidden",
  },
)

export const HeroSchema = Type.Intersect(
  [
    HeroBaseSchema,
    Type.Union(
      [
        HeroGradientSchema,
        HeroBlockSchema,
        HeroLargeImageSchema,
        HeroFloatingSchema,
        HeroSearchbarSchema,
      ],
      {
        title: "Hero banner style",
        format: ARRAY_RADIO_FORMAT,
      },
    ),
  ],
  {
    title: "Hero component",
    description:
      "The hero component is used to display a large banner at the top of the homepage.",
  },
)

type CommonProps = {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
  theme?: "default" | "inverse"
}

export type HeroGradientProps = CommonProps &
  Static<typeof HeroBaseSchema> &
  Static<typeof HeroGradientSchema>

export type HeroBlockProps = CommonProps &
  Static<typeof HeroBaseSchema> &
  Static<typeof HeroBlockSchema>

export type HeroLargeImageProps = CommonProps &
  Static<typeof HeroBaseSchema> &
  Static<typeof HeroLargeImageSchema>

export type HeroFloatingProps = CommonProps &
  Static<typeof HeroBaseSchema> &
  Static<typeof HeroFloatingSchema>

export type HeroSearchbarProps = CommonProps &
  Static<typeof HeroBaseSchema> &
  Static<typeof HeroSearchbarSchema>

export type HeroProps = CommonProps & Static<typeof HeroSchema>
