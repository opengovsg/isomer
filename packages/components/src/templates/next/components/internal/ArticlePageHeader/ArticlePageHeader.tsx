import type { ArticlePageHeaderProps } from "~/interfaces"
import { getFormattedDate } from "~/utils/getFormattedDate"

import { Breadcrumb } from "../Breadcrumb"
import { EventDateFilterDates } from "../CollectionCard/EventDateFilterDates"
import { EventStatusPill } from "../CollectionCard/EventStatusPill"
import { useDateFilterCards } from "../CollectionCard/useDateFilterCards"
import { PillTags, PlaintextTags } from "../Tags"

export const ArticlePageHeader = ({
  breadcrumb,
  plaintextTags,
  title,
  date,
  summary,
  pillTags,
  dateFilterDisplayEntries,
}: ArticlePageHeaderProps) => {
  const dateFilterCards = useDateFilterCards(dateFilterDisplayEntries)
  const statusBadges =
    dateFilterCards?.filter(({ statusLabel }) => statusLabel.trim()) ?? []

  return (
    <div className="mx-auto w-full">
      <div className="my-16">
        <Breadcrumb links={breadcrumb.links} />
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          {statusBadges.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {statusBadges.map(({ id, status, statusLabel }) => (
                <EventStatusPill key={id} status={status} label={statusLabel} />
              ))}
            </div>
          )}

          <PlaintextTags
            tags={plaintextTags}
            className="prose-body-base text-base-content"
          />

          <h1 className="prose-display-md break-words text-base-content-strong">
            {title}
          </h1>

          {date && (
            <p className="prose-label-sm-medium text-base-content">
              {getFormattedDate(date)}
            </p>
          )}

          {dateFilterCards && (
            <EventDateFilterDates entries={dateFilterCards} />
          )}

          <PillTags
            tags={pillTags}
            className="flex flex-wrap items-center gap-2"
          />
        </div>

        {summary && (
          <p className="prose-title-lg whitespace-pre-wrap text-base-content-light">
            {summary}
          </p>
        )}
      </div>
    </div>
  )
}
