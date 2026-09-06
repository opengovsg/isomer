"use client"

import type { AriaButtonProps } from "@react-aria/button"
import type { VariantProps } from "tailwind-variants"
import { useButton } from "@react-aria/button"
import { useFocusRing } from "@react-aria/focus"
import { mergeProps } from "@react-aria/utils"
import { useEffect, useMemo, useRef, useState } from "react"
import { BiDownload, BiLoaderAlt } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { hasNonEmptyString } from "~/utils/truthiness"

import { buttonIconStyles, buttonStyles } from "../Button/common"
import { defaultDownloadStrategies, directDownloadStrategy } from "./strategies"

const downloadIconStyles = tv({
  extend: buttonIconStyles,
  variants: {
    isLoading: {
      true: "animate-spin",
    },
  },
})

const downloadFile = (url: string) => {
  const a = document.createElement("a")
  a.href = url
  // filename will be set by the browser
  a.download = ""
  document.body.append(a)
  a.click()
  a.remove()
}

interface DownloadButtonProps
  extends AriaButtonProps, VariantProps<typeof buttonStyles> {
  // URL to download the file from
  url: string
  className?: string
}

/**
 * Generic button that allows users to download a file.
 * Supports multiple download strategies including DGS and direct file downloads.
 */
export const DownloadButton = ({
  className,
  variant,
  size,
  colorScheme,
  url,
  ...props
}: DownloadButtonProps) => {
  const [text, setText] = useState<string>("Download")
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const ref = useRef<HTMLButtonElement>(null)

  const strategy = useMemo(
    () =>
      defaultDownloadStrategies.find((s) => s.canHandle(url)) ??
      // assume direct download if no strategy is found
      directDownloadStrategy,
    [url],
  )

  const handleDownload = async () => {
    if (isDownloading) {
      // Prevent multiple simultaneous downloads
      return
    }

    try {
      setIsDownloading(true)

      const downloadUrl = await strategy.getDownloadUrl(url)
      if (hasNonEmptyString(downloadUrl)) {
        downloadFile(downloadUrl)
      } else {
        console.error("Failed to get download URL")
      }
      setIsDownloading(false)
    } catch (error) {
      console.error("Download failed:", error)
      setIsDownloading(false)
    }
  }

  useEffect(() => {
    const updateDisplayText = async () => {
      try {
        const displayText = await strategy.getDisplayText(url)
        if (hasNonEmptyString(displayText)) {
          setText(displayText)
        }
      } catch (error) {
        console.error("Error getting display text:", error)
      }
    }
    void updateDisplayText()
  }, [url, strategy])

  const { buttonProps } = useButton(
    {
      ...props,
      isDisabled: isDownloading,
      onPress: () => {
        void handleDownload()
      },
    },
    ref,
  )
  const { focusProps, isFocusVisible } = useFocusRing()

  const mergedProps = mergeProps(buttonProps, focusProps)

  return (
    <button
      type="button"
      {...mergedProps}
      ref={ref}
      className={twMerge(
        buttonStyles({
          colorScheme,
          isDisabled: isDownloading,
          isFocusVisible,
          size,
          variant,
        }),
        className,
      )}
    >
      {text}
      {isDownloading ? (
        <BiLoaderAlt
          className={downloadIconStyles({ isLoading: isDownloading, size })}
        />
      ) : (
        <BiDownload className={downloadIconStyles({ size })} />
      )}
    </button>
  )
}
