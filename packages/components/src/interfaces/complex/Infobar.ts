import { Type, type Static } from "@sinclair/typebox"

export const InfobarSchema = Type.Object(
  {
    type: Type.Literal("infobar"),
    // TODO: Remove this property, only used in classic theme
    sectionIdx: Type.Optional(Type.Number()),
    title: Type.String({
      title: "Infobar title",
      description: "The title of the infobar",
    }),
    subtitle: Type.Optional(
      Type.String({
        title: "Infobar subtitle",
        description: "The subtitle of the infobar",
      }),
    ),
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
  LinkComponent?: any // Next.js link
}
