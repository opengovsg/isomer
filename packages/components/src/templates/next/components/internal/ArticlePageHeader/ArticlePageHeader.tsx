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
  if (summary.trim().length === 0) {
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

      <div className="prose-body-base mb-3 text-base-content">{category}</div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <h1 className="prose-display-md break-words text-base-content-strong">
            {title}
          </h1>
          {tags.length > 0 &&
            tags.flatMap(({ category, selected: labels }) => {
              return (
                <div className="flex w-full flex-col gap-4">
                  <div className="prose-label-sm flex flex-wrap items-center gap-2">
                    {category}
                    {labels.map((label) => {
                      return <Tag key={label}>{label}</Tag>
                    })}
                  </div>
                </div>
              )
            })}
        </div>

        {date && (
          <p className="prose-label-sm-medium text-base-content">
            {getFormattedDate(date)}
          </p>
        )}

        <div className="prose-title-lg text-base-content-light">
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
