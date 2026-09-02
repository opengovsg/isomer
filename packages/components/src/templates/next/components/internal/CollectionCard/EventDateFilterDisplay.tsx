"use client"

import type { PropsWithChildren, ReactNode } from "react"
import type { DateFilterDisplayEntry } from "~/interfaces/internal/CollectionCard"

import {
  EventDateFilterDatesFromEntries,
  EventDateFilterStatusBadges,
} from "./EventDateFilterClientParts"

interface EventDateFilterDisplayProps {
  entries?: DateFilterDisplayEntry[]
  beforeTitle?: ReactNode
}

export const EventDateFilterDisplay = ({
  entries,
  beforeTitle,
  children,
}: PropsWithChildren<EventDateFilterDisplayProps>) => {
  return (
    <>
      <EventDateFilterStatusBadges entries={entries} />
      {beforeTitle}
      {children}
      <EventDateFilterDatesFromEntries entries={entries} />
    </>
  )
}
