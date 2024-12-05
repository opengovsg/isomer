import type { ArticlePageHeaderProps } from "~/interfaces"
import { getFormattedDate } from "~/utils"
import BaseParagraph from "../BaseParagraph"
import Breadcrumb from "../Breadcrumb"
import { Tag } from "../Tag"

const ArticleSummaryContent = ({
  summary,
  site,
  LinkComponent,
}: Pick<ArticlePageHeaderProps, "summary" | "site" | "LinkComponent">) => {
  if (summary.length === 0) {
    return <></>
  }
  return (
    <BaseParagraph
      content={summary}
      site={site}
      LinkComponent={LinkComponent}
    />
  )
}

const ArticlePageHeader = ({
  breadcrumb,
  category,
  title,
  date,
  summary,
  site,
  LinkComponent,
  tags = [],
}: ArticlePageHeaderProps) => {
  return (
    <div className="mx-auto w-full">
      <div className="my-16">
        <Breadcrumb links={breadcrumb.links} LinkComponent={LinkComponent} />
      </div>

      <div className="mb-3 text-base font-medium text-gray-600">{category}</div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <h1 className="break-words text-3xl font-semibold tracking-tight text-content-strong lg:text-4xl">
            {title}
          </h1>
          {tags.flatMap(({ selected: labels }) => {
            return (
              <div className="flex w-full flex-wrap items-center gap-2">
                {labels.map((label) => {
                  return <Tag>{label}</Tag>
                })}
              </div>
            )
          })}
        </div>

        {date && (
          <p className="text-sm text-gray-800">{getFormattedDate(date)}</p>
        )}

        <div className="text-xl tracking-tight text-gray-500 md:text-2xl">
          <ArticleSummaryContent
            summary={summary}
            site={site}
            LinkComponent={LinkComponent}
          />
        </div>
      </div>
    </div>
  )
}

export default ArticlePageHeader
