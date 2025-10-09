import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { SimpleProseSchema } from "../native/Prose"

export const NotificationSchema = Type.Object(
  {
    enabled: Type.Boolean({
      title: "Display a banner",
      description:
        "The site notification will always be visible on the site until it is dismissed by the user.",
      default: false,
    }),
    title: Type.String({
      title: "Notification title",
      maxLength: 100,
    }),
    content: Type.Optional(SimpleProseSchema),
  },
  {
    title: "Notification component",
  },
)

export type NotificationProps = Static<typeof NotificationSchema> & {
  LinkComponent?: LinkComponentType
  site: IsomerSiteProps
}

export type NotificationClientProps = Pick<
  Static<typeof NotificationSchema>,
  "title"
> & {
  baseParagraph: React.ReactNode
}
