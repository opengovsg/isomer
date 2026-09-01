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

      <PlaintextTags
        tags={plaintextTags}
        className="prose-body-base mb-3 text-base-content"
      />

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <EventDateFilterDisplay entries={dateFilterDisplayEntries}>
            <h1 className="prose-display-md break-words text-base-content-strong">
              {title}
            </h1>
          </EventDateFilterDisplay>
          <PillTags
            tags={pillTags}
            className="flex flex-wrap items-center gap-2"
          />
        </div>

        {date && (
          <p className="prose-label-sm-medium text-base-content">
            {getFormattedDate(date)}
          </p>
        )}

        {summary && (
          <p className="prose-title-lg whitespace-pre-wrap text-base-content-light">
            {summary}
          </p>
        )}
      </div>
    </div>
  )
}
