import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const InfobarSchema = Type.Object(
  {
    type: Type.Literal("infobar", { default: "infobar" }),
    title: Type.String({
      title: "Infobar title",
      description: "The title of the infobar",
    }),
    description: Type.Optional(
      Type.String({
        title: "Infobar content",
        description: "The content of the infobar",
      }),
    ),
    buttonLabel: Type.Optional(
      Type.String({
        title: "Button label",
        description: "The label for the primary button",
      }),
    ),
    buttonUrl: Type.Optional(
      Type.String({
        title: "Button URL",
        description: "The URL for the primary button",
      }),
    ),
    secondaryButtonLabel: Type.Optional(
      Type.String({
        title: "Secondary button label",
        description: "The label for the secondary button",
      }),
    ),
    secondaryButtonUrl: Type.Optional(
      Type.String({
        title: "Secondary button URL",
        description: "The URL for the secondary button",
      }),
    ),
  },
  {
    title: "Infobar component",
  },
)

export type InfobarProps = Static<typeof InfobarSchema> & {
  sectionIdx?: number // TODO: Remove this property, only used in classic theme
  subtitle?: string // Subtitle that is only used in the classic theme
  LinkComponent?: any // Next.js link
}
