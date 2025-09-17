import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { TextSchema } from "../native/Text"

export const NotificationSchema = Type.Object(
  {
    title: Type.Optional(
      Type.String({
        title: "Notification title",
        description: "The title of the notification",
        format: "hidden",
      }),
    ),
    content: Type.Array(TextSchema, {
      title: "Notification content",
      description: "The content of the notification",
      format: "hidden",
    }),
  },
  {
    title: "Notification component",
    format: "hidden",
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
