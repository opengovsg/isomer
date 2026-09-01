"use client"

import type { ArticlePagePageProps, CollectionPagePageProps } from "~/types"

import { EventDateFilterDates } from "../CollectionCard/EventDateFilterDates"
import { EventStatusPill } from "../CollectionCard/EventStatusPill"
import { useDateFilterCards } from "./useDateFilterCards"

interface ArticleDateFilterPillsProps {
  dateTagged: ArticlePagePageProps["dateTagged"]
  tagCategories: CollectionPagePageProps["tagCategories"]
}

export const ArticleDateFilterPills = ({
  dateTagged,
  tagCategories,
}: ArticleDateFilterPillsProps) => {
  const dateFilterCards = useDateFilterCards(dateTagged, tagCategories)

  if (!dateFilterCards || dateFilterCards.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {dateFilterCards.map(({ id, status, statusLabel }) => (
        <EventStatusPill key={id} status={status} label={statusLabel} />
      ))}
    </div>
  )
}

interface ArticleDateFilterDatesProps {
  dateTagged: ArticlePagePageProps["dateTagged"]
  tagCategories: CollectionPagePageProps["tagCategories"]
}

export const ArticleDateFilterDatesSection = ({
  dateTagged,
  tagCategories,
}: ArticleDateFilterDatesProps) => {
  const dateFilterCards = useDateFilterCards(dateTagged, tagCategories)

  if (!dateFilterCards || dateFilterCards.length === 0) {
    return null
  }

  return <EventDateFilterDates entries={dateFilterCards} />
}
