"use client"

import { useState } from "react"
import { BiInfoCircle, BiX } from "react-icons/bi"

import type { NotificationProps } from "~/interfaces"
import { getTextAsHtml } from "~/utils"
import BaseParagraph from "../BaseParagraph"
import { IconButton } from "../IconButton"

const NotificationBanner = ({ content, title }: NotificationProps) => {
  const [isShown, setIsShown] = useState(true)
  const onDismiss = () => {
    setIsShown(false)
  }

  return (
    isShown && (
      <div className="bg-base-canvas-backdrop">
        <div className="relative mx-auto flex max-w-screen-xl flex-row gap-4 px-6 py-8 text-base-content md:px-10 md:py-6">
          <BiInfoCircle className="h-6 w-6 shrink-0" />
          <div className="flex flex-1 flex-col gap-1">
            {!!title && <h2 className="prose-headline-lg-medium">{title}</h2>}
            <BaseParagraph
              content={getTextAsHtml(content)}
              className="prose-body-base [&:not(:first-child)]:mt-0 [&:not(:last-child)]:mb-0"
            />
          </div>
          <div aria-hidden className="flex h-6 w-6 shrink-0" />
          <IconButton
            onPress={onDismiss}
            icon={BiX}
            className="absolute right-3 top-5 md:right-7 md:top-3"
            aria-label="Dismiss notification temporarily"
          />
        </div>
      </div>
    )
  )
}

export default NotificationBanner
