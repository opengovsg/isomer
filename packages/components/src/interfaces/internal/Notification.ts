import type { Static } from "@sinclair/typebox"
import type { PropsWithChildren } from "react"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { TextSchema } from "../native"
import { SimpleProseSchema } from "../native/Prose"

export const NotificationSchema = Type.Object(
  {
    title: Type.String({
      title: "Notification title",
      maxLength: 150,
    }),
    content: Type.Optional(
      Type.Union([Type.Array(TextSchema), SimpleProseSchema], {
        format: "simple-prose",
        maxLength: 300,
      }),
    ),
  },
  {
    title: "Display a banner",
    description:
      "The site notification will always be visible on the site until it is dismissed by the user.",
  },
)

export type NotificationProps = Static<typeof NotificationSchema> & {
  LinkComponent?: LinkComponentType
  site: IsomerSiteProps
}

export type NotificationClientProps = PropsWithChildren<
  Pick<Static<typeof NotificationSchema>, "title">
>

export const NotificationSettingsSchema = Type.Object({
  notification: Type.Optional(NotificationSchema),
})
