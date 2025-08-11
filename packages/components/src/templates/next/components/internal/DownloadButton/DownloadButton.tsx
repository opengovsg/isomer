"use client"

import type { ButtonProps as AriaButtonProps } from "react-aria-components"
import type { VariantProps } from "tailwind-variants"
import { useEffect, useMemo, useState } from "react"
import { Button as AriaButton, composeRenderProps } from "react-aria-components"
import { BiDownload, BiLoaderAlt } from "react-icons/bi"

import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
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
  a.download = "" // filename will be set by the browser
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export interface DownloadButtonProps
  extends AriaButtonProps,
    VariantProps<typeof buttonStyles> {
  url: string // URL to download the file from
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

  const strategy = useMemo(
    () =>
      defaultDownloadStrategies.find((s) => s.canHandle(url)) ??
      directDownloadStrategy, // assume direct download if no strategy is found
    [url],
  )

  const handleDownload = async () => {
    if (isDownloading) return // Prevent multiple simultaneous downloads

    try {
      setIsDownloading(true)

      const downloadUrl = await strategy.getDownloadUrl(url)
      if (downloadUrl) {
        downloadFile(downloadUrl)
      } else {
        console.error("Failed to get download URL")
      }
    } catch (error) {
      console.error("Download failed:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  useEffect(() => {
    const updateDisplayText = async () => {
      try {
        const displayText = await strategy.getDisplayText(url)
        if (displayText) {
          setText(displayText)
        }
      } catch (error) {
        console.error("Error getting display text:", error)
      }
    }
    void updateDisplayText()
  }, [url, strategy])

  return (
    <AriaButton
      {...props}
      isDisabled={isDownloading}
      className={composeRenderProps(className, (className, renderProps) =>
        twMerge(
          buttonStyles({
            ...renderProps,
            variant,
            size,
            className,
            colorScheme,
            isDisabled: isDownloading,
          }),
          className,
        ),
      )}
      onPress={handleDownload}
    >
      {text}
      {isDownloading ? (
        <BiLoaderAlt
          className={downloadIconStyles({ size, isLoading: isDownloading })}
        />
      ) : (
        <BiDownload className={downloadIconStyles({ size })} />
      )}
    </AriaButton>
  )
}
