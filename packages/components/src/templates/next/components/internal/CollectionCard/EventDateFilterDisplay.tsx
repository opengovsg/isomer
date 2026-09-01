"use client"

import type { PropsWithChildren } from "react"
import type {
  DateFilterCard,
  DateFilterDisplayEntry,
} from "~/interfaces/internal/CollectionCard"
import type { CollectionPagePageProps } from "~/types"
import { useMemo } from "react"
import { isDateFilter } from "~/types/page"

import {
  getDateFilterStatus,
  getTodayInSingapore,
} from "../../../layouts/Collection/utils/getDateFilterStatus"
import { EventDateFilterDates } from "./EventDateFilterDates"
import { EventStatusPill } from "./EventStatusPill"

interface EventDateFilterDisplayProps {
  entries?: DateFilterDisplayEntry[]
  tagCategories?: CollectionPagePageProps["tagCategories"]
}

const resolveLiveDateFilterCards = (
  entries: DateFilterDisplayEntry[],
  tagCategories: CollectionPagePageProps["tagCategories"],
  today: string = getTodayInSingapore(),
): DateFilterCard[] => {
  const dateCategories = tagCategories?.filter(isDateFilter) ?? []

  return entries.map((entry) => {
    const category = dateCategories.find(
      (tagCategory) => tagCategory.id === entry.id,
    )
    const status = getDateFilterStatus(entry, today)
    const statusLabel =
      category?.statusLabels.find(({ id }) => id === status)?.label ?? status

    return { ...entry, status, statusLabel }
  })
}

// Client boundary for date-filter status pills + date text. Server passes
// pre-computed `entries` (label + dateText); this component derives status
// labels (Upcoming/Ongoing/Ended) at view time using Singapore today.
export const EventDateFilterDisplay = ({
  entries,
  tagCategories,
  children,
}: PropsWithChildren<EventDateFilterDisplayProps>) => {
  const dateFilterCards = useMemo(() => {
    if (!entries || entries.length === 0 || !tagCategories) {
      return undefined
    }

    return resolveLiveDateFilterCards(entries, tagCategories)
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
