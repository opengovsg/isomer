import type { Static } from "@sinclair/typebox"
import type { PropsWithChildren } from "react"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { SimpleProseSchema } from "../native/Prose"
import { TextSchema } from "../native/Text"

export const NotificationSchema = Type.Object(
  {
    content: Type.Optional(
      Type.Union([Type.Array(TextSchema), SimpleProseSchema], {
        format: "simple-prose",
        maxLength: 300,
      }),
    ),
    title: Type.String({
      maxLength: 150,
      title: "Notification title",
    }),
  },
  {
    description:
      "The site notification will always be visible on the site until it is dismissed by the user.",
    title: "Display a banner",
  },
)

export type NotificationProps = Static<typeof NotificationSchema> & {
  site: IsomerSiteProps
}

export type NotificationClientProps = PropsWithChildren<
  Pick<Static<typeof NotificationSchema>, "title">
>

export const NotificationSettingsSchema = Type.Object({
  notification: Type.Optional(NotificationSchema),
})
