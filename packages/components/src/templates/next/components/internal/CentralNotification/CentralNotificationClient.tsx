"use client"

import type {
  CentralNotificationBroadcast,
  CentralNotificationEntry,
  CentralNotificationProps,
} from "~/interfaces"
import { useEffect, useState } from "react"
import { useIsCentralNotificationDismissed } from "~/hooks/useIsCentralNotificationDismissed"
import { getTextAsHtml } from "~/utils/getTextAsHtml"

import { Prose } from "../../native/Prose"
import { hasContent } from "../../native/Prose/utils"
import { BaseParagraph } from "../BaseParagraph"
import { NotificationBanner } from "../Notification/NotificationBanner"

interface CentralNotificationClientProps extends CentralNotificationProps {
  assetsBaseUrl: string
  siteUrl: string
}

export const CentralNotificationClient = ({
  assetsBaseUrl,
  siteUrl,
  site,
}: CentralNotificationClientProps) => {
  const [isDismissed, setIsDismissed] = useIsCentralNotificationDismissed()
  const [matchedEntry, setMatchedEntry] =
    useState<CentralNotificationEntry | null>(null)

  useEffect(() => {
    if (isDismissed || !assetsBaseUrl) return

    fetch(`${assetsBaseUrl}/central-notification.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch central notification")
        return res.json()
      })
      .then((data: CentralNotificationBroadcast) => {
        if (!Array.isArray(data)) return

        const match = data.find((entry) => entry.targetSites.includes(siteUrl))
        if (match) {
          setMatchedEntry(match)
        }
      })
      .catch(() => {
        // Silently fail - no notification is shown if fetch fails
      })
  }, [assetsBaseUrl, siteUrl, isDismissed])

  const onDismiss = () => {
    setIsDismissed(true)
  }

  if (isDismissed || !matchedEntry) return null

  const { notification } = matchedEntry
  const { title, content } = notification

  const ContentParagraph = () => {
    if (!content) return null
    if (content instanceof Array) {
      return (
        <BaseParagraph
          content={getTextAsHtml({ site, content })}
          className="prose-body-base"
        />
      )
    }
    if (hasContent(content.content)) {
      return <Prose {...content} site={site} headingLevel={3} />
    }
    return null
  }

  return (
    <NotificationBanner title={title} onDismiss={onDismiss}>
      <ContentParagraph />
    </NotificationBanner>
  )
}
