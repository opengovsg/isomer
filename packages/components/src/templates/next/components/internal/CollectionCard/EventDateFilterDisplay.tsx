"use client"

import type { PropsWithChildren } from "react"
import type { DateFilterDisplayEntry } from "~/interfaces/internal/CollectionCard"
import { useMemo } from "react"

import { getDateFilterCardsFromEntries } from "../../../layouts/Collection/utils/dateFilterCards"
import { getTodayInSingapore } from "../../../layouts/Collection/utils/getDateFilterStatus"
import { EventDateFilterDates } from "./EventDateFilterDates"
import { EventStatusPill } from "./EventStatusPill"

interface EventDateFilterDisplayProps {
  entries?: DateFilterDisplayEntry[]
}

export const EventDateFilterDisplay = ({
  entries,
  children,
}: PropsWithChildren<EventDateFilterDisplayProps>) => {
  const dateFilterCards = useMemo(() => {
    if (!entries || entries.length === 0) {
      return undefined
    }

    return getDateFilterCardsFromEntries(entries, getTodayInSingapore())
  }, [entries])

  if (!dateFilterCards || dateFilterCards.length === 0) {
    return children ?? null
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {dateFilterCards.map(({ id, status, statusLabel }) => (
          <EventStatusPill key={id} status={status} label={statusLabel} />
        ))}
      </div>
      {children}
      <EventDateFilterDates entries={dateFilterCards} />
    </>
  )
}
