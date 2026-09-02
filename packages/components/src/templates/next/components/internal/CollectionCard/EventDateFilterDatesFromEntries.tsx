"use client"

import type { DateFilterDisplayEntry } from "~/interfaces/internal/CollectionCard"
import { useMemo } from "react"

import { EventDateFilterDates } from "./EventDateFilterDates"
import { resolveDateFilterCards } from "./resolveDateFilterCards"

interface EventDateFilterDatesFromEntriesProps {
  entries?: DateFilterDisplayEntry[]
}

export const EventDateFilterDatesFromEntries = ({
  entries,
}: EventDateFilterDatesFromEntriesProps) => {
  const dateFilterCards = useMemo(
    () => resolveDateFilterCards(entries),
    // today only updates when entries changes; open past SGT midnight may show stale status
    [entries],
  )

  if (!dateFilterCards || dateFilterCards.length === 0) {
    return null
  }

  return <EventDateFilterDates entries={dateFilterCards} />
}
