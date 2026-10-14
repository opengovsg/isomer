import type { Static } from "@sinclair/typebox"
import type { PropsWithChildren } from "react"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { ARRAY_RADIO_FORMAT } from "../format"
import { TextSchema } from "../native"
import { SimpleProseSchema } from "../native/Prose"
import { IsomerString } from "../primitives/IsomerString"

const NotificationCustomSchema = Type.Object(
  {
    type: Type.Optional(
      Type.Literal("custom", {
        default: "custom",
      }),
    ),
    title: IsomerString({
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
  },
  {
    title: "Anti-scam disclaimer",
  },
)

export const NotificationSchema = Type.Union(
  [NotificationCustomSchema, NotificationAntiScamSchema],
  {
    title: "Type",
    format: ARRAY_RADIO_FORMAT,
  },
)

export type SiteNotificationConfig = Static<typeof NotificationSchema>

export type NotificationProps = SiteNotificationConfig & {
  site: IsomerSiteProps
}

export type NotificationClientProps = PropsWithChildren<
  Pick<Static<typeof NotificationCustomSchema>, "title">
>

export const NotificationSettingsSchema = Type.Object({
  notification: Type.Optional(NotificationSchema),
})
