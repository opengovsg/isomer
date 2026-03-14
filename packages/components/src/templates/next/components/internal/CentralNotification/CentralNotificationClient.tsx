"use client"

import { useEffect, useState } from "react"
import { BiInfoCircle, BiX } from "react-icons/bi"

import type {
  CentralNotificationBroadcast,
  CentralNotificationEntry,
  CentralNotificationProps,
} from "~/interfaces"
import { useIsCentralNotificationDismissed } from "~/hooks/useIsCentralNotificationDismissed"
import { getTextAsHtml } from "~/utils"
import { Prose } from "../../native/Prose"
import { hasContent } from "../../native/Prose/utils"
import { BaseParagraph } from "../BaseParagraph"
import { IconButton } from "../IconButton"

interface CentralNotificationClientProps extends CentralNotificationProps {
  assetsBaseUrl: string
  siteUrl: string
}

export const CentralNotificationClient = ({
  assetsBaseUrl,
  siteUrl,
  site,
  LinkComponent,
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
          LinkComponent={LinkComponent}
        />
      )
    }
    if (hasContent(content.content)) {
      return <Prose {...content} site={site} LinkComponent={LinkComponent} />
    }
    return null
  }

  return (
    <div className="bg-utility-feedback-info-faint">
      <div className="relative mx-auto flex max-w-screen-xl flex-row gap-4 px-6 py-8 text-base-content md:px-10 md:py-6">
        <BiInfoCircle className="mt-0.5 h-6 w-6 shrink-0" />
        <div className="flex flex-1 flex-col gap-1">
          {!!title && <h2 className="prose-headline-lg-medium">{title}</h2>}
          <div className="[&_p]:!mb-0 [&_p]:!mt-0">
            <ContentParagraph />
          </div>
        </div>
        <div aria-hidden className="flex h-6 w-6 shrink-0" />
        <IconButton
          onPress={onDismiss}
          icon={BiX}
          className="absolute right-3 top-[22px] md:right-7 md:top-3.5"
          aria-label="Dismiss central notification temporarily"
        />
      </div>
    </div>
  )
}
