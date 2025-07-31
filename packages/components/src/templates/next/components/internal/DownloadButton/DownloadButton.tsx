"use client"

import type { ButtonProps as AriaButtonProps } from "react-aria-components"
import type { VariantProps } from "tailwind-variants"
import { useEffect, useState } from "react"
import { Button as AriaButton, composeRenderProps } from "react-aria-components"
import { BiDownload, BiLoaderAlt } from "react-icons/bi"

import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import {
  fetchDgsFileDownloadUrl,
  fetchDgsMetadata,
  getDgsIdFromDgsLink,
} from "~/utils"
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
  url,
  ...props
}: DownloadButtonProps) => {
  const [text, setText] = useState<string | null>("Download")
  const [isDownloading, setIsDownloading] = useState<boolean>(false)

  const dgsId = getDgsIdFromDgsLink(url)

  const handleDownload = async () => {
    if (isDownloading) return // Prevent multiple simultaneous downloads

    try {
      setIsDownloading(true)

      if (dgsId) {
        const result = await fetchDgsFileDownloadUrl({ dgsId })
        if (result?.downloadUrl) {
          window.open(result.downloadUrl, "_blank")
        }
        return
      }

      console.log("downloading", url) // TODO: Implement download logic
    } catch (error) {
      console.error("Download failed:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  useEffect(() => {
    if (dgsId) {
      fetchDgsMetadata({ dgsId })
        .then((metadata) => {
          if (metadata) {
            setText(`Download ${metadata.format} (${metadata.datasetSize})`)
          }
        })
        .catch((error) => {
          console.error("Error fetching DGS metadata:", error)
        })
    }
  }, [dgsId])

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
