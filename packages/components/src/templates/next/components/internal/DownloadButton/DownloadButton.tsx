"use client"

import type { ButtonProps as AriaButtonProps } from "react-aria-components"
import type { VariantProps } from "tailwind-variants"
import { useState } from "react"
import { Button as AriaButton, composeRenderProps } from "react-aria-components"
import { BiDownload } from "react-icons/bi"

import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { buttonStyles } from "../Button"

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
  },
  defaultVariants: {
    size: "base",
  },
})

export interface DownloadButtonProps
  extends AriaButtonProps,
    VariantProps<typeof buttonStyles> {
  url: string // use to download the file from
}

/**
 * Button that allows users to download a file.
 */
export const DownloadButton = ({
  className,
  variant,
  size,
  colorScheme,
  children,
  url,
  ...props
}: DownloadButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (isDownloading) return // Prevent multiple simultaneous downloads

    try {
      setIsDownloading(true)
      console.log("downloading", url) // TODO: Implement download logic
      await new Promise((resolve) => setTimeout(resolve, 2000))
    } catch (error) {
      console.error("Download failed:", error)
    } finally {
      setIsDownloading(false)
    }
  }

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
      {composeRenderProps(children, (children) => (
        <>
          {children}
          <BiDownload className={downloadIconStyles({ size })} />
        </>
      ))}
    </AriaButton>
  )
}
