import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { NotificationSchema } from "./Notification"

export const CentralNotificationEntrySchema = Type.Object({
  notification: NotificationSchema,
  targetSites: Type.Array(Type.String(), {
    title: "Target sites",
    description: "List of site URLs to display this notification on.",
  }),
})

export const CentralNotificationBroadcastSchema = Type.Array(
  CentralNotificationEntrySchema,
  {
    title: "Central notification broadcast",
    description:
      "An array of notification entries, each targeting a set of sites. A site shows at most one notification (first match wins).",
  },
)

export type CentralNotificationEntry = Static<
  typeof CentralNotificationEntrySchema
>

export type CentralNotificationBroadcast = Static<
  typeof CentralNotificationBroadcastSchema
>

export interface CentralNotificationProps {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
