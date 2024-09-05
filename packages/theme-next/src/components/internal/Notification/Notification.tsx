"use client"

import { useState } from "react"
import { BiX } from "react-icons/bi"

import type { NotificationProps } from "~/interfaces"
import BaseParagraph from "../BaseParagraph"

const NotificationBanner = ({ content }: NotificationProps) => {
  const [isShown, setIsShown] = useState(true)
  const onDismiss = () => {
    setIsShown(false)
  }

  return (
    isShown && (
      <div className="flex flex-col justify-between gap-6 bg-site-primary-100 px-5 py-4 sm:flex-row sm:px-10">
        <BaseParagraph
          className="text-base text-content"
          content={content}
        ></BaseParagraph>
        <button
          className="ml-auto flex flex-row items-center gap-1"
          aria-label="Dismiss notification"
          onClick={onDismiss}
        >
          <p className="text-lg text-content">Dismiss</p>
          <BiX className="h-full" />
        </button>
      </div>
    )
  )
}

export default NotificationBanner
