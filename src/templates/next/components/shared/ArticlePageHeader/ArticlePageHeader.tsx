import type { ArticlePageHeaderProps } from "~/common"
import Breadcrumb from "../../Breadcrumb"
import BaseParagraph from "../Paragraph"
import { Paragraph } from "../../../typography/Paragraph"

const ArticlePageHeader = ({
  breadcrumb,
  category,
  title,
  date,
  summary,
  LinkComponent,
}: ArticlePageHeaderProps) => {
  return (
    <div className="px-4 lg:px-5">
      <div className="max-w-[960px] mx-auto">
        <div className="my-8 lg:my-16">
          <Breadcrumb links={breadcrumb.links} LinkComponent={LinkComponent} />
        </div>

        <div className="mb-3 text-lg text-content-medium">{category}</div>

        <div className="flex flex-col gap-9 max-w-[660px]">
          <h1 className="text-[2.375rem] leading-[2.75rem] lg:text-5xl lg:leading-[3.625rem] font-semibold text-content-strong">
            {title}
          </h1>

          <p className="text-xl leading-8 text-content-strong">{date}</p>

          <div className="bg-utility-neutral px-3 py-[1.125rem]">
            {summary.length === 1 ? (
              <BaseParagraph
                content={summary[0]}
                className={`text-content ${Paragraph[1]}`}
              />
            ) : (
              <ul className="list-disc ps-7">
                {summary.map((item) => (
                  <li key={Math.random()} className="[&_p]:inline pl-0.5">
                    <BaseParagraph
                      content={item}
                      className={`text-content ${Paragraph[1]}`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ArticlePageHeader
