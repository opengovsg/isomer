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
      }),
    ),
    content: Type.Array(TextSchema, {
      title: "Notification content",
      description: "The content of the notification",
    }),
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
