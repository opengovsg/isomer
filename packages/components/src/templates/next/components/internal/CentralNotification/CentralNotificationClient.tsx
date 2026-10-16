"use client"

import type {
  CentralNotificationBroadcast,
  CentralNotificationEntry,
  CentralNotificationProps,
} from "~/interfaces"
import { useEffect, useState } from "react"
import { useDismissedCentralNotification } from "~/hooks/useDismissedCentralNotification"
import { getTextAsHtml } from "~/utils/getTextAsHtml"

import { Prose } from "../../native/Prose"
import { hasContent } from "../../native/Prose/utils"
import { BaseParagraph } from "../BaseParagraph"
import { NotificationBanner } from "../Notification/NotificationBanner"

interface CentralNotificationClientProps extends CentralNotificationProps {
  assetsBaseUrl: string
  siteUrl: string
}

// Broadcast URLs are typed by hand; tolerate case and trailing-slash drift
const normaliseUrl = (url: string) =>
  url.trim().toLowerCase().replace(/\/+$/, "")

export const CentralNotificationClient = ({
  assetsBaseUrl,
  siteUrl,
  site,
}: CentralNotificationClientProps) => {
  const [dismissedKey, setDismissedKey] = useDismissedCentralNotification()
  const [matchedEntry, setMatchedEntry] =
    useState<CentralNotificationEntry | null>(null)

  useEffect(() => {
    if (!assetsBaseUrl) return

    fetch(`${assetsBaseUrl}/central-notification.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch central notification")
        return res.json()
      })
      .then((data: CentralNotificationBroadcast) => {
        if (!Array.isArray(data)) return

        const normalisedSiteUrl = normaliseUrl(siteUrl)
        const match = data.find(
          (entry) =>
            Array.isArray(entry.targetSites) &&
            entry.targetSites.some(
              (target) => normaliseUrl(target) === normalisedSiteUrl,
            ),
        )
        if (match) {
          setMatchedEntry(match)
        }
      })
      .catch(() => undefined)
  }, [assetsBaseUrl, siteUrl])

  if (!matchedEntry) return null

  const { notification } = matchedEntry
  const notificationKey = JSON.stringify(notification)
  if (dismissedKey === notificationKey) {
    return null
  }

  const onDismiss = () => {
    setDismissedKey(notificationKey)
  }

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
