import type { Static } from "@sinclair/typebox"
import type { PropsWithChildren } from "react"
import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { Type } from "@sinclair/typebox"

import { ARRAY_RADIO_FORMAT } from "../format"
import { TextSchema } from "../native"
import { SimpleProseSchema } from "../native/Prose"

const NotificationCustomSchema = Type.Object(
  {
    type: Type.Optional(
      Type.Literal("custom", {
        default: "custom",
      }),
    ),
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
    title: "Custom notification",
  },
)

const NotificationAntiScamSchema = Type.Object(
  {
    type: Type.Literal("antiscam", {
      default: "antiscam",
    }),
    useAntiScamMessage: Type.Boolean({
      title: "Use AntiScam message",
      description:
        "Use the pre-approved text that warns against Government Officials Impersonation Scams (GOIS).",
    }),
  },
  {
    title: "AntiScam advisory message",
  },
)

export const NotificationSchema = Type.Union(
  [NotificationCustomSchema, NotificationAntiScamSchema],
  {
    title: "Display a banner",
    description:
      "The site notification will always be visible on the site until it is dismissed by the user.",
    format: ARRAY_RADIO_FORMAT,
  },
)

export type SiteNotificationConfig = Static<typeof NotificationSchema>

export type NotificationTitleContentConfig = Pick<
  Static<typeof NotificationCustomSchema>,
  "title" | "content"
>

export type NotificationProps = SiteNotificationConfig & {
  LinkComponent?: LinkComponentType
  site: IsomerSiteProps
}

export type NotificationClientProps = PropsWithChildren<
  Pick<Static<typeof NotificationCustomSchema>, "title">
>

export const NotificationSettingsSchema = Type.Object({
  notification: Type.Optional(NotificationSchema),
})
