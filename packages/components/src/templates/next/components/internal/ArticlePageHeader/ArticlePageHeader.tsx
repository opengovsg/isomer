import type { ArticlePageHeaderProps } from "~/interfaces"
import { getFormattedDate } from "~/utils/getFormattedDate"

import { Breadcrumb } from "../Breadcrumb"
import { DateFilterDates } from "../CollectionCard/DateFilterDates"
import { DateFilterStatusClient } from "../CollectionCard/DateFilterStatusClient"
import { LabeledDate } from "../CollectionCard/LabeledDate"
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
  const hasDateFilters = (dateFilterDisplayEntries?.length ?? 0) > 0

  return (
    <div className="mx-auto w-full">
      <div className="my-16">
        <Breadcrumb links={breadcrumb.links} />
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          {hasDateFilters && (
            <DateFilterStatusClient entries={dateFilterDisplayEntries} />
          )}

          <PlaintextTags
            tags={plaintextTags}
            className="prose-body-base text-base-content"
          />

          <h1 className="prose-display-md break-words text-base-content-strong">
            {title}
          </h1>
        </div>

        <DateFilterDates entries={dateFilterDisplayEntries} />

        {date &&
          (hasDateFilters ? (
            <LabeledDate
              label="Page published"
              dateText={getFormattedDate(date)}
            />
          ) : (
            <p className="prose-label-sm-medium text-base-content">
              {getFormattedDate(date)}
            </p>
          ))}

        <PillTags
          tags={pillTags}
          className="flex flex-wrap items-center gap-2"
          containerClassName="flex flex-col gap-4"
        />

        {summary && (
          <p className="prose-title-lg whitespace-pre-wrap text-base-content-light">
            {summary}
          </p>
        )}
      </div>
    </div>
  )
}
