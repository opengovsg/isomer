import type { Static } from "@sinclair/typebox"
import type { Simplify } from "type-fest"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { omit } from "lodash-es"
import { SUPPORTED_ICON_NAMES } from "~/common/icons"
import { IMAGE_ACCEPTED_MIME_TYPE_MAPPING } from "~/constants/image"
import {
  LINK_HREF_PATTERN,
  NON_EMPTY_STRING_REGEX,
  TRIMMED_NON_EMPTY_STRING_REGEX,
} from "~/utils/validation"

import { ARRAY_RADIO_FORMAT, HERO_ACTION_LAYOUT_FORMAT } from "../format"
import { generateImageSrcSchema } from "./Image"

export const HERO_STYLE = {
  gradient: "gradient",
  block: "block",
  largeImage: "largeImage",
  floating: "floating",
  searchbar: "searchbar",
} as const

export const HERO_ACTION_LAYOUT = {
  buttons: "buttons",
  quickActions: "quickActions",
} as const

export type HeroActionLayout =
  (typeof HERO_ACTION_LAYOUT)[keyof typeof HERO_ACTION_LAYOUT]

const HeroBaseSchema = Type.Object({
  type: Type.Literal("hero", { default: "hero" }),
  title: Type.String({
    title: "Hero text",
    description: "The title of the hero banner",
    maxLength: 100,
    pattern: NON_EMPTY_STRING_REGEX,
    errorMessage: {
      pattern: "cannot be empty or contain only spaces",
    },
  }),
  subtitle: Type.Optional(
    Type.String({
      title: "Description",
      description: "The contents of the hero banner",
      format: "textarea",
      maxLength: 300,
    }),
  ),
})

const CallToActionsSchema = Type.Object({
  buttonLabel: Type.Optional(
    Type.String({
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
    Type.String({
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

export const HERO_QUICK_ACTION_ITEM_TITLE_PLACEHOLDER = "Quick action title"

const HeroActionLayoutQuickActionItemSchema = Type.Object({
  icon: Type.Union(
    SUPPORTED_ICON_NAMES.map((icon) =>
      Type.Literal(icon, {
        title: icon.charAt(0).toUpperCase() + icon.slice(1).replace(/-/g, " "),
      }),
    ),
    {
      title: "Column icon",
      type: "string",
      visibleWhen: {
        property: "showIcon",
        schema: { const: true },
        root: true,
      },
    },
  ),
  title: Type.Optional(
    Type.String({
      title: "Title",
      placeholder: HERO_QUICK_ACTION_ITEM_TITLE_PLACEHOLDER,
      pattern: TRIMMED_NON_EMPTY_STRING_REGEX,
      errorMessage: {
        pattern: "cannot be empty or contain only spaces",
      },
    }),
  ),
  description: Type.String({
    title: "Description",
    pattern: NON_EMPTY_STRING_REGEX,
    errorMessage: {
      pattern: "cannot be empty or contain only spaces",
    },
  }),
  buttonLabel: Type.String({
    title: "Call-to-action text",
    maxLength: 50,
    pattern: NON_EMPTY_STRING_REGEX,
    description:
      "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
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

const HeroGradientCallToActionsSchema = Type.Object({
  buttonLabel: Type.Optional(
    Type.String({
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
    Type.String({
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

const HeroGradientSharedSchema = Type.Composite(
  [
    Type.Object({
      variant: Type.Literal(HERO_STYLE.gradient, {
        default: HERO_STYLE.gradient,
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
      // Optional so existing gradient heroes with no actionLayout still match this branch.
      actionLayout: Type.Optional(
        Type.Literal(HERO_ACTION_LAYOUT.buttons, {
          default: HERO_ACTION_LAYOUT.buttons,
        }),
      ),
    }),
    HeroGradientCallToActionsSchema,
  ],
  {
    title: "Buttons only",
    groups: [
      GROUPINGS.PRIMARY_CALL_TO_ACTION,
      GROUPINGS.SECONDARY_CALL_TO_ACTION,
    ],
  },
)

const HeroGradientQuickActionsLayoutSchema = Type.Object(
  {
    actionLayout: Type.Literal(HERO_ACTION_LAYOUT.quickActions, {
      default: HERO_ACTION_LAYOUT.quickActions,
    }),
    quickActionsTitle: Type.Optional(
      Type.String({
        title: "Title",
        pattern: TRIMMED_NON_EMPTY_STRING_REGEX,
        errorMessage: {
          pattern: "cannot be empty or contain only spaces",
        },
      }),
    ),
    showIcon: Type.Boolean({
      title: "Show icons",
      default: true,
    }),
    quickActionsItems: Type.Array(HeroActionLayoutQuickActionItemSchema, {
      title: "Content",
      minItems: 2,
      maxItems: 4,
    }),
  },
  {
    title: "Quick actions",
    groups: [
      {
        label: "Quick actions",
        fields: ["quickActionsTitle", "showIcon", "quickActionsItems"],
      },
    ],
  },
)

const HeroGradientSchema = Type.Intersect(
  [
    HeroGradientSharedSchema,
    // Same shape as InfoCards: shared fields, then a oneOf for the variant.
    // No discriminator — existing heroes omit actionLayout and must still match buttons.
    Type.Unsafe<
      | Static<typeof HeroGradientButtonsLayoutSchema>
      | Static<typeof HeroGradientQuickActionsLayoutSchema>
    >({
      oneOf: [
        HeroGradientButtonsLayoutSchema,
        HeroGradientQuickActionsLayoutSchema,
      ],
      format: HERO_ACTION_LAYOUT_FORMAT,
      title: "Layout",
    }),
  ],
  {
    title: "Gradient (Default)",
  },
)

const HeroBlockSchema = Type.Composite(
  [
    Type.Object({
      variant: Type.Literal(HERO_STYLE.block, { default: HERO_STYLE.block }),
      backgroundUrl: BackgroundUrlSchema,
    }),
    HeroBaseSchema,
    CallToActionsSchema,
  ],
  {
    title: "Block",
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
      variant: Type.Literal(HERO_STYLE.largeImage, {
        default: HERO_STYLE.largeImage,
      }),
      backgroundUrl: BackgroundUrlSchema,
    }),
    HeroBaseSchema,
    CallToActionsSchema,
  ],
  {
    title: "Large image",
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
      variant: Type.Literal(HERO_STYLE.floating, {
        default: HERO_STYLE.floating,
      }),
      backgroundUrl: BackgroundUrlSchema,
    }),
    HeroBaseSchema,
    CallToActionsSchema,
  ],
  {
    title: "Floating",
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
      variant: Type.Literal(HERO_STYLE.searchbar, {
        default: HERO_STYLE.searchbar,
      }),
      backgroundUrl: Type.Optional(BackgroundUrlSchema),
    }),
    HeroBaseSchema,
  ],
  {
    title: "Search bar",
    format: "hidden", // beta: we don't want to show this in the UI yet
    groups: [GROUPINGS.TEXT],
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
        title: "Hero banner style",
        format: ARRAY_RADIO_FORMAT,
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

export type HeroActionLayoutQuickActionItem = Static<
  typeof HeroActionLayoutQuickActionItemSchema
>

/** Props for the shared CTA buttons row (gradient `actionLayout` only today). */
export type HeroActionLayoutButtonsPanelProps = Simplify<
  Pick<CommonProps, "site"> & Static<typeof HeroGradientCallToActionsSchema>
>

/** Props for the shared quick-actions panel (gradient `actionLayout` only today). */
export type HeroActionLayoutQuickActionsPanelProps = Simplify<
  Pick<CommonProps, "site" | "headingLevel"> & {
    quickActionsTitle?: string
    showIcon: boolean
    quickActionsItems: HeroActionLayoutQuickActionItem[]
  }
>

export type HeroGradientButtonsProps = Simplify<
  CommonProps &
    Static<typeof HeroGradientSharedSchema> &
    Static<typeof HeroGradientButtonsLayoutSchema>
>

export type HeroActionLayoutQuickActionsProps = Simplify<
  CommonProps &
    Static<typeof HeroGradientSharedSchema> &
    Static<typeof HeroGradientQuickActionsLayoutSchema>
>

export type HeroGradientProps =
  | HeroGradientButtonsProps
  | HeroActionLayoutQuickActionsProps

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
