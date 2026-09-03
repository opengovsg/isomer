"use client"

import type { DateFilterDisplayEntry } from "~/interfaces/internal/CollectionCard"
import { useMemo } from "react"
import { twMerge } from "~/lib/twMerge"

import { DateFilterStatusPill } from "./DateFilterStatusPill"
import { getDateFilterCardsFromEntries } from "./utils/getDateFilterCardsFromEntries"

interface DateFilterStatusClientProps {
  entries?: DateFilterDisplayEntry[]
  className?: string
}

export const DateFilterStatusClient = ({
  entries,
  className,
}: DateFilterStatusClientProps) => {
  const dateFilterCards = useMemo(
    () =>
      entries?.length ? getDateFilterCardsFromEntries(entries) : undefined,
    // today only updates when entries changes; open past SGT midnight may show stale status
    [entries],
  )

  if (!dateFilterCards) {
    return null
  }

  const statusBadges = dateFilterCards.filter(({ statusLabel }) =>
    statusLabel.trim(),
  )

  if (statusBadges.length === 0) {
    return null
  }

  return (
    <div className={twMerge("flex flex-wrap items-center gap-2", className)}>
      {statusBadges.map(({ id, status, statusLabel }) => (
        <DateFilterStatusPill key={id} status={status} label={statusLabel} />
      ))}
    </div>
  )
}
