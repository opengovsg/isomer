"use client"

import type { DateFilterDisplayEntry } from "~/interfaces/internal/CollectionCard"

import { EventDateFilterDates } from "./EventDateFilterDates"
import { EventStatusPill } from "./EventStatusPill"
import { useDateFilterCards } from "./useDateFilterCards"

interface EventDateFilterClientPartsProps {
  entries?: DateFilterDisplayEntry[]
}

export const EventDateFilterStatusBadges = ({
  entries,
}: EventDateFilterClientPartsProps) => {
  const dateFilterCards = useDateFilterCards(entries)

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

export const EventDateFilterDatesFromEntries = ({
  entries,
}: EventDateFilterClientPartsProps) => {
  const dateFilterCards = useDateFilterCards(entries)

  if (!dateFilterCards || dateFilterCards.length === 0) {
    return null
  }

  return <EventDateFilterDates entries={dateFilterCards} />
}
