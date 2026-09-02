"use client"

import type { DateFilterDisplayEntry } from "~/interfaces/internal/CollectionCard"
import { useMemo } from "react"

import { EventStatusPill } from "./EventStatusPill"
import { resolveDateFilterCards } from "./resolveDateFilterCards"

interface EventDateFilterStatusBadgesProps {
  entries?: DateFilterDisplayEntry[]
}

export const EventDateFilterStatusBadges = ({
  entries,
}: EventDateFilterStatusBadgesProps) => {
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
        <EventStatusPill key={id} status={status} label={statusLabel} />
      ))}
    </div>
  )
}
