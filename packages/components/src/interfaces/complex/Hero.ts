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

import {
  HERO_ACTION_LAYOUT_FORMAT,
  HERO_BANNER_STYLE_FORMAT,
  HERO_QUICK_ACTIONS_FORMAT,
  ICON_PICKER_FORMAT,
} from "../format"
import { IsomerString } from "../primitives/IsomerString"
import { generateImageSrcSchema } from "./Image"

export const HERO_STYLE = {
  gradient: { key: "gradient", title: "Gradient (Default)" },
  block: { key: "block", title: "Block" },
  largeImage: { key: "largeImage", title: "Large image" },
  floating: { key: "floating", title: "Floating" },
  searchbar: { key: "searchbar", title: "Search bar" },
} as const

export const HERO_ACTION_LAYOUT = {
  buttons: "buttons",
  quickActions: "quickActions",
} as const

export type HeroActionLayout =
  (typeof HERO_ACTION_LAYOUT)[keyof typeof HERO_ACTION_LAYOUT]

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
      format: ICON_PICKER_FORMAT,
    },
  ),
  title: Type.String({
    title: "Title",
    pattern: TRIMMED_NON_EMPTY_STRING_REGEX,
    errorMessage: {
      pattern: "cannot be empty or contain only spaces",
    },
  }),
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

const HeroGradientQuickActionsFieldsSchema = Type.Object({
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
    format: HERO_QUICK_ACTIONS_FORMAT,
    minItems: 2,
    maxItems: 4,
  }),
})

const HeroGradientButtonsLayoutSchema = Type.Composite(
  [
    Type.Object({
      // Optional so existing gradient heroes with no actionLayout still match buttons.
      actionLayout: Type.Optional(
        Type.Literal(HERO_ACTION_LAYOUT.buttons, {
          default: HERO_ACTION_LAYOUT.buttons,
        }),
      ),
    }),
    CallToActionsSchema,
  ],
  {
    title: "Buttons only",
    groups: [
      GROUPINGS.PRIMARY_CALL_TO_ACTION,
      GROUPINGS.SECONDARY_CALL_TO_ACTION,
    ],
  },
)

const HeroGradientQuickActionsLayoutSchema = Type.Composite(
  [
    Type.Object({
      actionLayout: Type.Literal(HERO_ACTION_LAYOUT.quickActions, {
        default: HERO_ACTION_LAYOUT.quickActions,
      }),
    }),
    HeroGradientQuickActionsFieldsSchema,
  ],
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
        format: HERO_BANNER_STYLE_FORMAT,
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
  Pick<CommonProps, "site"> & Static<typeof CallToActionsSchema>
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
    Static<typeof CallToActionsSchema>
>

export type HeroActionLayoutQuickActionsProps = Simplify<
  CommonProps &
    Static<typeof HeroGradientSharedSchema> &
    Static<typeof HeroGradientQuickActionsFieldsSchema>
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

export type HeroProps =
  | HeroGradientProps
  | HeroBlockProps
  | HeroLargeImageProps
  | HeroFloatingProps
  | HeroSearchbarProps
