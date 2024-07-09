import { Type, type Static } from "@sinclair/typebox"

const HeroHeadingSchema = Type.Object({
  title: Type.String({
    title: "Hero title",
    description: "The title of the hero banner",
  }),
  subtitle: Type.Optional(
    Type.String({
      title: "Hero content",
      description: "The content of the hero banner",
    }),
  ),
})

const HeroButtonsSchema = Type.Object({
  buttonLabel: Type.Optional(
    Type.String({
      title: "Button text",
      description:
        "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
    }),
  ),
  buttonUrl: Type.Optional(
    Type.String({
      title: "Button destination",
      description: "When this is clicked, open:",
      format: "link",
    }),
  ),
  secondaryButtonLabel: Type.Optional(
    Type.String({
      title: "Button text",
      description:
        "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
    }),
  ),
  secondaryButtonUrl: Type.Optional(
    Type.String({
      title: "Button destination",
      description: "When this is clicked, open:",
      format: "link",
    }),
  ),
})

const HeroKeyHighlightSchema = Type.Object({
  keyHighlights: Type.Optional(
    Type.Array(
      Type.Object({
        title: Type.String({
          title: "Key highlight label",
          description: "The label of the key highlight",
        }),
        description: Type.String({
          title: "Key highlight description",
          description: "The description of the key highlight",
        }),
        url: Type.String({
          title: "Key highlight URL",
          description:
            "The URL to navigate to when the key highlight is clicked",
        }),
      }),
      {
        maxItems: 4,
      },
    ),
  ),
})

const HeroDropdownSchema = Type.Object({
  title: Type.Optional(
    Type.String({
      title: "Dropdown label",
      description: "The label of the dropdown",
    }),
  ),
  options: Type.Array(
    Type.Object({
      title: Type.String({
        title: "Dropdown option label",
        description: "The label of the dropdown option",
      }),
      url: Type.String({
        title: "Dropdown option URL",
        description:
          "The URL to navigate to when the dropdown option is clicked",
        format: "link",
      }),
    }),
    {
      title: "Dropdown options",
      minItems: 1,
    },
  ),
})

const HeroBackgroundImageSchema = Type.Object({
  backgroundUrl: Type.String({
    title: "Background image URL",
    description: "The URL of the background image",
    format: "image",
  }),
})

const HeroContentAlignmentSchema = Type.Object({
  alignment: Type.Optional(
    Type.Union([Type.Literal("left"), Type.Literal("right")], {
      title: "Hero alignment",
      description: "The position to align the hero content to",
    }),
  ),
})

const HeroInfoboxSchema = Type.Composite([
  HeroHeadingSchema,
  HeroButtonsSchema,
  HeroContentAlignmentSchema,
  Type.Object({
    backgroundColor: Type.Optional(
      Type.Union(
        [Type.Literal("black"), Type.Literal("white"), Type.Literal("gray")],
        {
          title: "Hero background color",
          description: "The background color of the hero banner",
        },
      ),
    ),
    size: Type.Optional(
      Type.Union([Type.Literal("sm"), Type.Literal("md")], {
        title: "Hero size",
        description: "The size of the hero banner",
      }),
    ),
    dropdown: Type.Optional(HeroDropdownSchema),
  }),
])

const HeroSideSchema = Type.Composite(
  [
    HeroInfoboxSchema,
    HeroBackgroundImageSchema,
    HeroKeyHighlightSchema,
    Type.Object({
      variant: Type.Literal("side"),
    }),
  ],
  {
    title: "Hero side variant",
    groups: [
      {
        label: "Primary call-to-action",
        fields: ["buttonLabel", "buttonUrl"],
      },
      {
        label: "Secondary call-to-action",
        fields: ["secondaryButtonLabel", "secondaryButtonUrl"],
      },
    ],
  },
)

const HeroImageSchema = Type.Composite(
  [
    HeroBackgroundImageSchema,
    HeroKeyHighlightSchema,
    Type.Object({
      variant: Type.Literal("image"),
      dropdown: Type.Optional(HeroDropdownSchema),
    }),
  ],
  {
    title: "Hero image variant",
  },
)

const HeroFloatingSchema = Type.Composite(
  [
    HeroInfoboxSchema,
    HeroBackgroundImageSchema,
    HeroKeyHighlightSchema,
    Type.Object({
      variant: Type.Literal("floating"),
    }),
  ],
  {
    title: "Hero floating variant",
  },
)

const HeroCenterSchema = Type.Composite(
  [
    HeroHeadingSchema,
    HeroButtonsSchema,
    HeroBackgroundImageSchema,
    HeroKeyHighlightSchema,
    Type.Object({
      variant: Type.Literal("center"),
      dropdown: Type.Optional(HeroDropdownSchema),
    }),
  ],
  {
    title: "Hero centre variant",
  },
)

const HeroGradientSchema = Type.Composite(
  [
    HeroHeadingSchema,
    HeroButtonsSchema,
    HeroBackgroundImageSchema,
    HeroContentAlignmentSchema,
    Type.Object({
      variant: Type.Literal("gradient"),
    }),
  ],
  {
    title: "Hero gradient variant",
  },
)

const HeroSplitSchema = Type.Composite(
  [
    HeroHeadingSchema,
    HeroButtonsSchema,
    HeroBackgroundImageSchema,
    HeroContentAlignmentSchema,
    Type.Object({
      variant: Type.Literal("split"),
      backgroundColor: Type.Optional(
        Type.Union([Type.Literal("black"), Type.Literal("white")], {
          title: "Hero background color",
          description: "The background color of the hero banner",
        }),
      ),
    }),
  ],
  {
    title: "Hero split variant",
  },
)

const HeroCopyLedSchema = Type.Composite(
  [
    HeroHeadingSchema,
    HeroButtonsSchema,
    Type.Partial(HeroBackgroundImageSchema),
    HeroKeyHighlightSchema,
    Type.Object({
      variant: Type.Literal("copyled"),
    }),
  ],
  {
    title: "Hero copy-led variant",
  },
)

const HeroFloatingImageSchema = Type.Composite(
  [
    HeroHeadingSchema,
    HeroButtonsSchema,
    HeroBackgroundImageSchema,
    HeroKeyHighlightSchema,
    Type.Object({
      variant: Type.Literal("floatingimage"),
    }),
  ],
  {
    title: "Hero floating image variant",
  },
)

export const HeroSchema = Type.Intersect(
  [
    Type.Object({
      type: Type.Literal("hero"),
    }),
    Type.Union([
      HeroSideSchema,
      HeroImageSchema,
      HeroFloatingSchema,
      HeroCenterSchema,
      HeroGradientSchema,
      HeroSplitSchema,
      HeroCopyLedSchema,
      HeroFloatingImageSchema,
    ]),
  ],
  {
    title: "Hero component",
    description:
      "The hero component is used to display a large banner at the top of the homepage.",
  },
)

export type HeroKeyHighlightProps = Static<typeof HeroKeyHighlightSchema>
export type HeroDropdownProps = Static<typeof HeroDropdownSchema>
export type HeroBackgroundImageProps = Static<typeof HeroBackgroundImageSchema>
export type HeroInfoboxProps = Static<typeof HeroInfoboxSchema>
export type HeroSideProps = Static<typeof HeroSideSchema>
export type HeroImageProps = Static<typeof HeroImageSchema>
export type HeroFloatingProps = Static<typeof HeroFloatingSchema>
export type HeroCenterProps = Static<typeof HeroCenterSchema>
export type HeroGradientProps = Static<typeof HeroGradientSchema>
export type HeroSplitProps = Static<typeof HeroSplitSchema>
export type HeroCopyLedProps = Static<typeof HeroCopyLedSchema>
export type HeroFloatingImageProps = Static<typeof HeroFloatingImageSchema>
export type HeroProps = Static<typeof HeroSchema>
