"use client"

import type { NotificationClientProps } from "~/interfaces"
import { useIsNotificationDismissed } from "~/hooks/useIsNotificationDismissed"

import { NotificationBanner } from "./NotificationBanner"

export const NotificationClient = ({
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
