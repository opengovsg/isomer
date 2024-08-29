"use client"

import { useState } from "react"
import Markdown from "markdown-to-jsx"
import { BiInfoCircle, BiX } from "react-icons/bi"

import type { NotificationProps } from "~/interfaces"
import { isExternalUrl } from "~/utils"
import { IconButton } from "../IconButton"
import { Link } from "../Link"

const NotificationBanner = ({ content }: NotificationProps) => {
  const [isShown, setIsShown] = useState(true)
  const onDismiss = () => {
    setIsShown(false)
  }

  return (
    isShown && (
      <div className="bg-base-canvas-backdrop">
        <div className="relative mx-auto flex max-w-screen-xl flex-row gap-4 px-6 py-8 text-base-content md:px-10 md:py-6">
          <BiInfoCircle className="h-6 w-6 shrink-0" />
          <div className="flex-1">
            <Markdown
              options={{
                // slugify to ensure unique ids for headings
                slugify: (input) => `notification-${input}`,
                overrides: {
                  a: {
                    component: ({ children, ...props }) => {
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      const isExternal = isExternalUrl(String(props.href ?? ""))
                      return (
                        <Link
                          {...props}
                          withFocusVisibleHighlight
                          isExternal={isExternal}
                          showExternalIcon={isExternal}
                        >
                          {children}
                        </Link>
                      )
                    },
                  },
                  h2: {
                    props: {
                      className: "prose-headline-lg-medium",
                    },
                  },
                },
              }}
            >{`${content}`}</Markdown>
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
