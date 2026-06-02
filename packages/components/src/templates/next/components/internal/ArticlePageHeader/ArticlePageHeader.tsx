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

      <div className="prose-body-base text-base-content mb-3">{category}</div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <h1 className="prose-display-md text-base-content-strong break-words">
            {title}
          </h1>
          {tags.length > 0 &&
            tags.flatMap(({ category, selected: labels }) => {
              return (
                <div className="prose-label-sm flex flex-wrap items-center gap-2">
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
          <p className="prose-title-lg text-base-content-light whitespace-pre-wrap">
            {summary}
          </p>
        )}
      </div>
    </div>
  )
}
