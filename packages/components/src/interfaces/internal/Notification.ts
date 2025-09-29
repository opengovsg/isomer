import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { ProseValueSchema } from "../native/Prose"

export const NotificationSchema = Type.Object(
  {
    title: Type.String({
      title: "Notification title",
      description: "The title of the notification",
    }),
    content: Type.Optional(ProseValueSchema),
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
