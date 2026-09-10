"use client"

import type { DateFilterDisplayEntry } from "~/interfaces/internal/DateFilter"
import { useMemo } from "react"
import { twMerge } from "~/lib/twMerge"

import { EventStatusPill } from "./EventStatusPill"
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
    // NOTE: status is only recomputed when `entries` changes. It can stay stale
    // if the page stays mounted across Singapore midnight — accepted.
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
        <EventStatusPill key={id} status={status} label={statusLabel} />
      ))}
    </div>
  )
}
