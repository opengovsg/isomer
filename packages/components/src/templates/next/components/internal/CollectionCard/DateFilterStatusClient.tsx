"use client"

import type { DateFilterDisplayEntry } from "~/interfaces/internal/DateFilter"
import { useMemo } from "react"

import { getDateFilterCardsFromEntries } from "../../../layouts/Collection/utils/dateFilterCards"
import { getTodayInSingapore } from "../../../layouts/Collection/utils/getDateFilterStatus"
import { EventStatusPill } from "./EventStatusPill"

interface DateFilterStatusClientProps {
  entries?: DateFilterDisplayEntry[]
}

export const DateFilterStatusClient = ({
  entries,
}: DateFilterStatusClientProps) => {
  const dateFilterCards = useMemo(
    () =>
      entries?.length
        ? getDateFilterCardsFromEntries(entries, getTodayInSingapore())
        : undefined,
    // NOTE: `today` is only recomputed when `entries` changes. Status can stay
    // stale if the page stays mounted across Singapore midnight — accepted.
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
    <div className="flex flex-wrap items-center gap-2">
      {statusBadges.map(({ id, status, statusLabel }) => (
        <EventStatusPill key={id} status={status} label={statusLabel} />
      ))}
    </div>
  )
}
