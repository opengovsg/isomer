import type { Static } from "@sinclair/typebox"
import type { IsomerPageLayoutType, IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import { LINK_HREF_PATTERN } from "~/utils/validation"

import { ARRAY_RADIO_FORMAT } from "../../format"
import { DEFAULT_INFOBAR_VARIANT, INFOBAR_VARIANT } from "./constants"

const generateInfobarSchema = ({
  includeDarkVariant,
}: {
  includeDarkVariant: boolean
}) => 
  Type.Object(
    {
      buttonLabel: Type.Optional(
        Type.String({
          description:
            "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
          maxLength: 50,
          title: "Button text",
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
      description: Type.Optional(
        Type.String({
          title: "Description",
        }),
      ),
      secondaryButtonLabel: Type.Optional(
        Type.String({
          description:
            "A descriptive text. Avoid generic text such as “Click here” or “Learn more”",
          maxLength: 50,
          title: "Secondary button text",
        }),
      ),
      secondaryButtonUrl: Type.Optional(
        Type.String({
          description: "When this is clicked, open:",
          format: "link",
          pattern: LINK_HREF_PATTERN,
          title: "Secondary button destination",
        }),
      ),
      title: Type.String({
        title: "Title",
      }),
      type: Type.Literal("infobar", { default: "infobar" }),
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
            format: includeDarkVariant ? ARRAY_RADIO_FORMAT : "hidden",
            title: "Call-to-Action style",
            type: "string",
          },
        ),
      ),
    },
    {
      groups: [
        {
          fields: ["buttonLabel", "buttonUrl"],
          label: "Primary call-to-action",
        },
        {
          fields: ["secondaryButtonLabel", "secondaryButtonUrl"],
          label: "Secondary call-to-action",
        },
      ],
      title: "Call-to-Action",
    },
  )


export const InfobarHomepageSchema = generateInfobarSchema({
  includeDarkVariant: true,
})

export const InfobarDefaultSchema = generateInfobarSchema({
  includeDarkVariant: false,
})

export type InfobarProps = Static<typeof InfobarHomepageSchema> & {
  // NOTE: Remove this property, only used in classic theme
  sectionIdx?: number
  // Subtitle that is only used in the classic theme
  subtitle?: string
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  headingLevel: number
}
