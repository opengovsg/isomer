import type { ContentPageHeaderProps } from "~/interfaces"
import { getFormattedDate } from "~/utils"
import Button from "../../complex/Button"
import BaseParagraph from "../BaseParagraph"
import Breadcrumb from "../Breadcrumb"

const ContentPageHeader = ({
  title,
  summary,
  lastUpdated,
  breadcrumb,
  buttonLabel,
  buttonUrl,
  LinkComponent,
}: ContentPageHeaderProps) => {
  return (
    <div className="bg-site-primary-100 px-4 py-8 md:px-10 lg:px-5 lg:py-16">
      <div className="mx-auto flex max-w-[848px] flex-col gap-8 lg:gap-12">
        <div className="hidden lg:block">
          <Breadcrumb links={breadcrumb.links} LinkComponent={LinkComponent} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[2.75rem] font-semibold leading-tight text-content-strong lg:text-[3.75rem]">
            {title}
          </h1>
          <div className="pt-6 lg:pb-2">{`Last updated ${getFormattedDate(lastUpdated)}`}</div>
          <BaseParagraph
            content={summary}
            className="text-paragraph-01 text-content"
          />
        </div>
        {buttonLabel && buttonUrl && (
          <Button
            label={buttonLabel}
            href={buttonUrl}
            rightIcon="right-arrow"
            LinkComponent={LinkComponent}
          />
        )}
      </div>
    </div>
  )
}

export default ContentPageHeader
