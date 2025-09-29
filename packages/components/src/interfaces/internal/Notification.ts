import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { ProseSchema } from "../native"

export const NotificationSchema = Type.Object(
  {
    title: Type.Optional(
      Type.String({
        title: "Notification title",
        description: "The title of the notification",
        format: "hidden",
      }),
    ),
    content: ProseSchema,
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
