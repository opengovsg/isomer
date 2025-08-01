import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type {
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"
import { LINK_HREF_PATTERN } from "~/utils/validation"
import { ARRAY_RADIO_FORMAT } from "../format"

const INFOBAR_VARIANT = {
  light: "light",
  dark: "dark",
} as const

export const DEFAULT_INFOBAR_VARIANT = INFOBAR_VARIANT.light

const generateInfobarSchema = ({
  includeDarkVariant,
}: {
  includeDarkVariant: boolean
}) => {
  return Type.Object(
    {
      type: Type.Literal("infobar", { default: "infobar" }),
      title: Type.String({
        title: "Title",
        maxLength: 100,
      }),
      description: Type.Optional(
        Type.String({
          title: "Description",
          maxLength: 200,
        }),
      ),
      variant: Type.Optional(
        Type.Union(
          [
            Type.Literal(INFOBAR_VARIANT.light, {
              title: "Light (Default)",
            }),
            ...(includeDarkVariant
              ? [
                  Type.Literal(INFOBAR_VARIANT.dark, {
                    title: "Dark",
                  }),
                ]
              : []),
          ],
          {
            default: DEFAULT_INFOBAR_VARIANT,
            title: "Call-to-Action style",
            format: includeDarkVariant ? ARRAY_RADIO_FORMAT : "hidden",
            type: "string",
          },
        ),
      ),
      buttonLabel: Type.Optional(
        Type.String({
          title: "Button text",
          description:
            "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
          maxLength: 50,
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
          title: "Secondary button text",
          maxLength: 50,
          description:
            "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
        }),
      ),
      secondaryButtonUrl: Type.Optional(
        Type.String({
          title: "Secondary button destination",
          description: "When this is clicked, open:",
          format: "link",
          pattern: LINK_HREF_PATTERN,
        }),
      ),
    },
    {
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
      title: "Infobar component",
    },
  )
}

export const InfobarHomepageSchema = generateInfobarSchema({
  includeDarkVariant: true,
})

export const InfobarDefaultSchema = generateInfobarSchema({
  includeDarkVariant: false,
})

export type InfobarProps = Static<typeof InfobarHomepageSchema> & {
  sectionIdx?: number // TODO: Remove this property, only used in classic theme
  subtitle?: string // Subtitle that is only used in the classic theme
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
