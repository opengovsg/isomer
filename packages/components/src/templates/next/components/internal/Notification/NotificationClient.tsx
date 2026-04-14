"use client"

import type { NotificationClientProps } from "~/interfaces"
import { BiInfoCircle, BiX } from "react-icons/bi"
import { useIsNotificationDismissed } from "~/hooks/useIsNotificationDismissed"

import { IconButton } from "../IconButton"

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
      <div className="bg-utility-feedback-info-faint">
        <div className="relative mx-auto flex max-w-screen-xl flex-row gap-2 px-6 py-4 text-base-content md:px-10 md:py-5">
          <BiInfoCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex flex-1 flex-col gap-1">
            {!!title && <h2 className="prose-headline-base-medium">{title}</h2>}
            <div className="[&_p]:!mb-0 [&_p]:!mt-0">{children}</div>
          </div>
          <div aria-hidden className="flex h-6 w-6 shrink-0" />
          <IconButton
            onPress={onDismiss}
            icon={BiX}
            className="absolute right-3 top-3 md:right-7 md:top-3"
            aria-label="Dismiss notification temporarily"
          />
        </div>
      </div>
    )
  )
}
