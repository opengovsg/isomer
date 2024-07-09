import type { ArticlePageHeaderProps } from "~/interfaces"
import BaseParagraph from "../BaseParagraph"
import Breadcrumb from "../Breadcrumb"

const ArticlePageHeader = ({
  breadcrumb,
  category,
  title,
  date,
  summary,
  LinkComponent,
}: ArticlePageHeaderProps) => {
  return (
    <div className="mx-auto w-full">
      <div className="my-16">
        <Breadcrumb links={breadcrumb.links} LinkComponent={LinkComponent} />
      </div>

      <div className="mb-3 text-base font-medium text-gray-600">{category}</div>

      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-semibold tracking-tight text-content-strong lg:text-4xl">
          {title}
        </h1>
        <p className="text-sm text-gray-800">{date}</p>

        <div className="text-xl tracking-tight text-gray-500 md:text-2xl">
          {summary.length === 1 ? (
            <BaseParagraph content={summary[0]} />
          ) : (
            <ul className="list-disc ps-7">
              {summary.map((item) => (
                <li key={Math.random()} className="pl-0.5 [&_p]:inline">
                  <BaseParagraph content={item} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default ArticlePageHeader
