"use client"

import type { PropsWithChildren, ReactNode } from "react"
import type { DateFilterDisplayEntry } from "~/interfaces/internal/CollectionCard"

import { EventDateFilterDates } from "./EventDateFilterDates"
import { EventStatusPill } from "./EventStatusPill"
import { useDateFilterCards } from "./useDateFilterCards"

interface EventDateFilterDisplayProps {
  entries?: DateFilterDisplayEntry[]
  beforeTitle?: ReactNode
  afterTitle?: ReactNode
  afterDates?: ReactNode
}

export const EventDateFilterDisplay = ({
  entries,
  beforeTitle,
  afterTitle,
  afterDates,
  children,
}: PropsWithChildren<EventDateFilterDisplayProps>) => {
  const dateFilterCards = useDateFilterCards(entries)

  if (!dateFilterCards || dateFilterCards.length === 0) {
    return (
      <>
        {beforeTitle}
        {children}
        {afterTitle}
        {afterDates}
      </>
    )
  }

  const statusBadges = dateFilterCards.filter(({ statusLabel }) =>
    statusLabel.trim(),
  )

  return (
    <>
      {statusBadges.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {statusBadges.map(({ id, status, statusLabel }) => (
            <EventStatusPill key={id} status={status} label={statusLabel} />
          ))}
        </div>
      )}
      {beforeTitle}
      {children}
      {afterTitle}
      <EventDateFilterDates entries={dateFilterCards} />
      {afterDates}
    </>
  )
}
