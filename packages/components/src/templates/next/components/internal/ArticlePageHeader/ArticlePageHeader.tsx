import type { ArticlePageHeaderProps } from "~/interfaces"
import { getFormattedDate } from "~/utils/getFormattedDate"

import { Breadcrumb } from "../Breadcrumb"
import { EventDateFilterDisplay } from "../CollectionCard/EventDateFilterDisplay"
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
  return (
    <div className="mx-auto w-full">
      <div className="my-16">
        <Breadcrumb links={breadcrumb.links} />
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <EventDateFilterDisplay
            entries={dateFilterDisplayEntries}
            beforeTitle={
              <PlaintextTags
                tags={plaintextTags}
                className="prose-body-base text-base-content"
              />
            }
            afterDates={
              <PillTags
                tags={pillTags}
                className="flex flex-wrap items-center gap-2"
              />
            }
          >
            <h1 className="prose-display-md break-words text-base-content-strong">
              {title}
            </h1>

            {date && (
              <p className="prose-label-sm-medium text-base-content">
                {getFormattedDate(date)}
              </p>
            )}
          </EventDateFilterDisplay>
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
