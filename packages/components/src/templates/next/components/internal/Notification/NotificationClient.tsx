"use client"

import type { NotificationClientProps } from "~/interfaces"
import { useIsNotificationDismissed } from "~/hooks/useIsNotificationDismissed"
import { island } from "~/islands/island"

import { NotificationBanner } from "./NotificationBanner"

const NotificationClientComponent = ({
  title,
  children,
}: NotificationClientProps) => {
  const [isDismissed, setIsDismissed] = useIsNotificationDismissed()

  const onDismiss = () => {
    setIsDismissed(true)
  }

  return (
    !isDismissed && (
      <NotificationBanner title={title} onDismiss={onDismiss}>
        {children}
      </NotificationBanner>
    )
  )
}

export const NotificationClient = island(
  "NotificationClient",
  NotificationClientComponent,
  { hydrate: "load" },
)
