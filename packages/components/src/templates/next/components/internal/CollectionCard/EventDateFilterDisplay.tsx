"use client"

import type { PropsWithChildren } from "react"
import type { DateFilterDisplayEntry } from "~/interfaces/internal/CollectionCard"
import type { CollectionPagePageProps } from "~/types"
import { useMemo } from "react"

import { getDateFilterCardsFromEntries } from "../../../layouts/Collection/utils/getDateFilterValues"
import { EventDateFilterDates } from "./EventDateFilterDates"
import { EventStatusPill } from "./EventStatusPill"

interface EventDateFilterDisplayProps {
  entries?: DateFilterDisplayEntry[]
  tagCategories?: CollectionPagePageProps["tagCategories"]
}

export const EventDateFilterDisplay = ({
  entries,
  tagCategories,
  children,
}: PropsWithChildren<EventDateFilterDisplayProps>) => {
  const dateFilterCards = useMemo(() => {
    if (!entries || entries.length === 0 || !tagCategories) {
      return undefined
    }

    return getDateFilterCardsFromEntries(entries, tagCategories)
  }, [entries, tagCategories])

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
