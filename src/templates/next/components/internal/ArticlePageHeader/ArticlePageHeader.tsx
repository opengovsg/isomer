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
    <div className="mx-auto w-full max-w-[960px]">
      <div className="my-8 lg:my-16">
        <Breadcrumb links={breadcrumb.links} LinkComponent={LinkComponent} />
      </div>

      <div className="mb-3 text-lg text-content-medium">{category}</div>

      <div className="flex max-w-[660px] flex-col gap-9">
        <h1 className="text-[2.375rem] font-semibold leading-[2.75rem] text-content-strong lg:text-5xl lg:leading-[3.625rem]">
          {title}
        </h1>

        <p className="text-xl leading-8 text-content-strong">{date}</p>

        <div className="bg-utility-neutral px-3 py-[1.125rem]">
          {summary.length === 1 ? (
            <BaseParagraph
              content={summary[0]}
              className="text-paragraph-01 text-content"
            />
          ) : (
            <ul className="list-disc ps-7">
              {summary.map((item) => (
                <li key={Math.random()} className="pl-0.5 [&_p]:inline">
                  <BaseParagraph
                    content={item}
                    className="text-paragraph-01 text-content"
                  />
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
