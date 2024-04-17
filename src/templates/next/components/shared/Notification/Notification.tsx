"use client"

import { BiX } from "react-icons/bi"
import { useState } from "react"
import BaseParagraph from "../Paragraph"
import { NotificationProps } from "~/common"

const NotificationBanner = ({ content }: NotificationProps) => {
  const [isShown, setIsShown] = useState(true)
  const onDismiss = () => {
    setIsShown(false)
  }

  return (
    isShown && (
      <div className="flex flex-col sm:flex-row justify-between gap-6 bg-site-primary-100 py-4 px-5 sm:px-10">
        <BaseParagraph className="text-base " content={content}></BaseParagraph>
        <button
          className="flex flex-row ml-auto items-center gap-1"
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
