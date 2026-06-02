import type { ArticlePageHeaderProps } from "~/interfaces"
import { getFormattedDate } from "~/utils/getFormattedDate"

import { Breadcrumb } from "../Breadcrumb"
import { Tag } from "../Tag"

export const ArticlePageHeader = ({
  breadcrumb,
  category,
  title,
  date,
  summary,
  tags = [],
}: ArticlePageHeaderProps) => {
  return (
    <div className="mx-auto w-full">
      <div className="my-16">
        <Breadcrumb links={breadcrumb.links} />
      </div>

      <div className="prose-body-base mb-3 text-base-content">{category}</div>

      <div className="flex-col gap-5 flex">
        <div className="flex-col gap-4 flex">
          <h1 className="prose-display-md break-words text-base-content-strong">
            {title}
          </h1>
          {tags.length > 0 &&
            tags.flatMap(({ category, selected: labels }) => {
              return (
                <div className="gap-2 prose-label-sm flex flex-wrap items-center">
                  {category}
                  {labels.map((label) => {
                    return <Tag key={label}>{label}</Tag>
                  })}
                </div>
              )
            })}
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
