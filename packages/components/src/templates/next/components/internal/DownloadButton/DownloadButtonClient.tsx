"use client"

import { useEffect, useMemo, useState } from "react"
import { Button as AriaButton } from "react-aria-components"
import { BiDownload, BiLoaderAlt } from "react-icons/bi"

import type { DownloadButtonClientProps } from "./types"
import { defaultDownloadStrategies, directDownloadStrategy } from "./strategies"

const downloadFile = (url: string) => {
  const a = document.createElement("a")
  a.href = url
  a.download = "" // filename will be set by the browser
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/**
 * Generic button that allows users to download a file.
 * Supports multiple download strategies including DGS and direct file downloads.
 */
export const DownloadButtonClient = ({
  url,
  buttonClassNames,
  iconClassNames,
  ...props
}: DownloadButtonClientProps) => {
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
      className={(renderProps) => {
        if (isDownloading && renderProps.isFocusVisible) {
          return buttonClassNames.disabledAndFocusVisible
        }
        if (isDownloading) {
          return buttonClassNames.disabled
        }
        if (renderProps.isFocusVisible) {
          return buttonClassNames.focusVisible
        }
        return buttonClassNames.base
      }}
      onPress={handleDownload}
    >
      {text}
      {isDownloading ? (
        <BiLoaderAlt className={iconClassNames.loading} />
      ) : (
        <BiDownload className={iconClassNames.base} />
      )}
    </AriaButton>
  )
}
