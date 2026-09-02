"use client"

import type { DateFilterDisplayEntry } from "~/interfaces/internal/CollectionCard"
import { useMemo } from "react"

import { DateFilterStatusPill } from "./DateFilterStatusPill"
import { resolveDateFilterCards } from "./resolveDateFilterCards"

interface DateFilterStatusClientProps {
  entries?: DateFilterDisplayEntry[]
}

export const DateFilterStatusClient = ({
  entries,
}: DateFilterStatusClientProps) => {
  const dateFilterCards = useMemo(
    () => resolveDateFilterCards(entries),
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
    <div className="flex flex-wrap items-center gap-2">
      {statusBadges.map(({ id, status, statusLabel }) => (
        <DateFilterStatusPill key={id} status={status} label={statusLabel} />
      ))}
    </div>
  )
}
