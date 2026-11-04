import type { Static } from "@sinclair/typebox"
import type { Simplify } from "type-fest"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { omit } from "lodash-es"
import { IMAGE_ACCEPTED_MIME_TYPE_MAPPING } from "~/constants/image"
import { LINK_HREF_PATTERN, NON_EMPTY_STRING_REGEX } from "~/utils/validation"

import {
  HERO_ACTION_LAYOUT_FORMAT,
  HERO_BANNER_STYLE_FORMAT,
  HERO_BLOCK_IMAGE_FORMAT,
  HERO_CAROUSEL_FORMAT,
  HERO_CAROUSEL_SLIDES_FORMAT,
  HERO_QUICK_LINKS_FORMAT,
} from "../format"
import { IconPicker } from "../primitives/IconPicker"
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

export const HERO_CAROUSEL_LAYOUT = {
  block: "block",
  gradient: "gradient",
} as const

export type HeroCarouselLayout =
  (typeof HERO_CAROUSEL_LAYOUT)[keyof typeof HERO_CAROUSEL_LAYOUT]

export const HERO_CAROUSEL_CONTENT_ALIGNMENT = {
  left: "left",
  center: "center",
} as const

export type HeroCarouselContentAlignment =
  (typeof HERO_CAROUSEL_CONTENT_ALIGNMENT)[keyof typeof HERO_CAROUSEL_CONTENT_ALIGNMENT]

export const HERO_GRADIENT_ACTION_LAYOUT = {
  buttons: "buttons",
  quickLinks: "quickLinks",
} as const

export type HeroGradientActionLayout =
  (typeof HERO_GRADIENT_ACTION_LAYOUT)[keyof typeof HERO_GRADIENT_ACTION_LAYOUT]

export const HERO_QUICK_LINKS_LIMITS = {
  minItems: 2,
  maxItems: 4,
} as const

export const HERO_BLOCK_IMAGE_POSITION = {
  left: "left",
  right: "right",
} as const

export type HeroCarouselImagePosition =
  (typeof HERO_BLOCK_IMAGE_POSITION)[keyof typeof HERO_BLOCK_IMAGE_POSITION]

export const HERO_BLOCK_IMAGE_EDGE = {
  straight: "straight",
  curved: "curved",
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

function heroContentFields(descriptions: { title: string; subtitle: string }) {
  return {
    title: IsomerString({
      title: "Hero text",
      description: descriptions.title,
      maxLength: 100,
      pattern: NON_EMPTY_STRING_REGEX,
      errorMessage: {
        pattern: "cannot be empty or contain only spaces",
      },
    }),
    subtitle: Type.Optional(
      IsomerString({
        title: "Description",
        description: descriptions.subtitle,
        format: "textarea",
        maxLength: 300,
      }),
    ),
  }
}

const HeroBaseSchema = Type.Object({
  type: Type.Literal("hero", { default: "hero" }),
  ...heroContentFields({
    title: "The title of the hero banner",
    subtitle: "The contents of the hero banner",
  }),
})

const CallToActionsSchema = Type.Object({
  buttonLabel: Type.Optional(
    IsomerString({
      title: "Primary button text",
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
      title: "Secondary button text",
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

const HeroGradientQuickLinksItemSchema = Type.Object({
  icon: IconPicker(),
  title: IsomerString({
    title: "Title",
    pattern: NON_EMPTY_STRING_REGEX,
    errorMessage: {
      pattern: "cannot be empty or contain only spaces",
    },
  }),
  description: IsomerString({
    title: "Description",
    pattern: NON_EMPTY_STRING_REGEX,
    errorMessage: {
      pattern: "cannot be empty or contain only spaces",
    },
  }),
  buttonUrl: Type.String({
    title: "Call-to-action destination",
    description: "When this is clicked, open:",
    format: "link",
    pattern: LINK_HREF_PATTERN,
  }),
})

const HeroGradientSharedSchema = Type.Composite(
  [
    Type.Object({
      variant: Type.Literal(HERO_STYLE.gradient.key, {
        default: HERO_STYLE.gradient.key,
      }),
      backgroundUrl: BackgroundUrlSchema,
    }),
    HeroBaseSchema,
  ],
  {
    groups: [GROUPINGS.TEXT],
  },
)

const HeroGradientButtonsLayoutSchema = Type.Composite(
  [
    Type.Object({
      // Optional so existing gradient heroes with no actions still match buttons.
      actions: Type.Optional(
        Type.Object({
          layout: Type.Literal(HERO_GRADIENT_ACTION_LAYOUT.buttons, {
            default: HERO_GRADIENT_ACTION_LAYOUT.buttons,
          }),
        }),
      ),
    }),
    // Button fields stay at the root, matching existing gradient heroes and the other hero styles.
    CallToActionsSchema,
  ],
  {
    title: "Buttons only",
  },
)

const HeroGradientQuickLinksLayoutSchema = Type.Object(
  {
    actions: Type.Object({
      layout: Type.Literal(HERO_GRADIENT_ACTION_LAYOUT.quickLinks, {
        default: HERO_GRADIENT_ACTION_LAYOUT.quickLinks,
      }),
      title: Type.Optional(
        IsomerString({
          title: "Title",
          pattern: NON_EMPTY_STRING_REGEX,
          errorMessage: {
            pattern: "cannot be empty or contain only spaces",
          },
        }),
      ),
      showIcon: Type.Boolean({
        title: "Show icons",
        default: true,
      }),
      items: Type.Array(HeroGradientQuickLinksItemSchema, {
        title: "Content",
        format: HERO_QUICK_LINKS_FORMAT,
        ...HERO_QUICK_LINKS_LIMITS,
      }),
    }),
  },
  {
    title: "Quick links",
  },
)

const HeroGradientSchema = Type.Intersect(
  [
    HeroGradientSharedSchema,
    Type.Unsafe<
      | Static<typeof HeroGradientButtonsLayoutSchema>
      | Static<typeof HeroGradientQuickLinksLayoutSchema>
    >({
      oneOf: [
        HeroGradientButtonsLayoutSchema,
        HeroGradientQuickLinksLayoutSchema,
      ],
      format: HERO_ACTION_LAYOUT_FORMAT,
      title: "Layout",
      description:
        "Check the desktop layout in Fullscreen, under preview options",
    }),
  ],
  {
    title: "Gradient (Default)",
  },
)

const HeroBlockSchema = Type.Composite(
  [
    Type.Object({
      variant: Type.Literal(HERO_STYLE.block.key, {
        default: HERO_STYLE.block.key,
      }),
      backgroundUrl: BackgroundUrlSchema,
      blockImage: Type.Optional(
        Type.Object(
          {
            imagePosition: Type.Union(
              [
                Type.Literal(HERO_BLOCK_IMAGE_POSITION.right),
                Type.Literal(HERO_BLOCK_IMAGE_POSITION.left),
              ],
              { type: "string" },
            ),
            imageEdge: Type.Union(
              [
                Type.Literal(HERO_BLOCK_IMAGE_EDGE.straight),
                Type.Literal(HERO_BLOCK_IMAGE_EDGE.curved),
              ],
              { type: "string" },
            ),
          },
          {
            format: HERO_BLOCK_IMAGE_FORMAT,
          },
        ),
      ),
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

export const HeroCarouselSlideSchema = Type.Composite(
  [
    Type.Object({
      backgroundUrl: BackgroundUrlSchema,
      ...heroContentFields({
        title:
          "Keep it short. The slide with the most text sets the height for all slides.",
        subtitle:
          "Keep text lengths similar across slides, or shorter slides will look empty.",
      }),
    }),
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

export const HERO_CAROUSEL_SLIDE_LIMITS = {
  minItems: 2,
  maxItems: 4,
} as const

const HeroCarouselSchema = Type.Object(
  {
    type: Type.Literal("hero", { default: "hero" }),
    variant: Type.Literal(HERO_STYLE.carousel.key, {
      default: HERO_STYLE.carousel.key,
    }),
    carousel: Type.Union(
      [
        Type.Object({
          layout: Type.Literal(HERO_CAROUSEL_LAYOUT.block, { title: "Block" }),
          imagePosition: Type.Union(
            [
              Type.Literal(HERO_BLOCK_IMAGE_POSITION.right, {
                title: "Right",
              }),
              Type.Literal(HERO_BLOCK_IMAGE_POSITION.left, {
                title: "Left",
              }),
            ],
            { type: "string" },
          ),
        }),
        Type.Object({
          layout: Type.Literal(HERO_CAROUSEL_LAYOUT.gradient, {
            title: "Gradient",
          }),
          contentAlignment: Type.Union(
            [
              Type.Literal(HERO_CAROUSEL_CONTENT_ALIGNMENT.left, {
                title: "Left",
              }),
              Type.Literal(HERO_CAROUSEL_CONTENT_ALIGNMENT.center, {
                title: "Center",
              }),
            ],
            { type: "string" },
          ),
        }),
      ],
      { format: HERO_CAROUSEL_FORMAT },
    ),
    slides: Type.Array(HeroCarouselSlideSchema, {
      title: "Slides",
      format: HERO_CAROUSEL_SLIDES_FORMAT,
      ...HERO_CAROUSEL_SLIDE_LIMITS,
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

export type HeroGradientQuickLinksItem = Static<
  typeof HeroGradientQuickLinksItemSchema
>

export type HeroGradientButtonsProps = Simplify<
  CommonProps &
    Static<typeof HeroGradientSharedSchema> &
    Static<typeof HeroGradientButtonsLayoutSchema>
>

export type HeroGradientQuickLinksProps = Simplify<
  CommonProps &
    Static<typeof HeroGradientSharedSchema> &
    Static<typeof HeroGradientQuickLinksLayoutSchema>
>

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
