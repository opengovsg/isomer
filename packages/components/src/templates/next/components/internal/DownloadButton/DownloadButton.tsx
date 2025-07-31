"use client"

import type { ButtonProps as AriaButtonProps } from "react-aria-components"
import type { VariantProps } from "tailwind-variants"
import { useEffect, useMemo, useState } from "react"
import { Button as AriaButton, composeRenderProps } from "react-aria-components"
import { BiDownload, BiLoaderAlt } from "react-icons/bi"

import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { buttonStyles } from "../Button"
import { defaultDownloadStrategies, directDownloadStrategy } from "./strategies"

const downloadButtonStyles = tv({
  base: "flex items-center gap-2",
})

const downloadIconStyles = tv({
  base: "h-auto flex-shrink-0",
  variants: {
    size: {
      sm: "w-2.5 lg:w-3",
      base: "w-3.5 lg:w-4",
      lg: "w-4.5 lg:w-5",
    },
    isLoading: {
      true: "animate-spin",
    },
  },
  defaultVariants: {
    size: "base",
  },
})

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
        window.open(downloadUrl, "_blank")
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
        buttonStyles({
          ...renderProps,
          variant,
          size,
          className: twMerge(downloadButtonStyles(), className),
          colorScheme,
        }),
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
