"use client"

import { BiInfoCircle, BiX } from "react-icons/bi"
import { useSessionStorage } from "usehooks-ts"

import type { NotificationClientProps } from "~/interfaces"
import { IconButton } from "../IconButton"

const NotificationClient = ({
  title,
  baseParagraph,
}: NotificationClientProps) => {
  const [isDismissed, setIsDismissed] = useSessionStorage(
    "notification-dismissed",
    false,
  )

  const onDismiss = () => {
    setIsDismissed(true)
  }

  return (
    !isDismissed && (
      <div className="bg-utility-feedback-info-faint">
        <div className="relative mx-auto flex max-w-screen-xl flex-row gap-4 px-6 py-8 text-base-content md:px-10 md:py-6">
          <BiInfoCircle className="mt-0.5 h-6 w-6 shrink-0" />
          <div className="flex flex-1 flex-col gap-1">
            {!!title && <h2 className="prose-headline-lg-medium">{title}</h2>}
            {baseParagraph}
          </div>
          <div aria-hidden className="flex h-6 w-6 shrink-0" />
          <IconButton
            onPress={onDismiss}
            icon={BiX}
            className="absolute right-3 top-[22px] md:right-7 md:top-3.5"
            aria-label="Dismiss notification temporarily"
          />
        </div>
      </div>
    )
  )
}

export default NotificationClient
