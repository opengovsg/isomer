import type { ContentPageHeaderProps } from "~/interfaces"
import Button from "../../complex/Button"
import Breadcrumb from "../Breadcrumb"
import BaseParagraph from "../BaseParagraph"
import { Paragraph } from "../../../typography/Paragraph"

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
    <div className="bg-site-primary-100 px-4 py-8 md:py-10 lg:px-5 lg:py-16">
      <div className="max-w-[848px] flex flex-col gap-8 lg:gap-12 mx-auto">
        <div className="hidden lg:block">
          <Breadcrumb links={breadcrumb.links} LinkComponent={LinkComponent} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[2.75rem] leading-tight lg:text-[3.75rem] font-semibold text-content-strong">
            {title}
          </h1>
          <div className="pt-6 lg:pb-2">{`Last updated ${new Date(
            lastUpdated,
          ).toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}`}</div>
          <BaseParagraph
            content={summary}
            className={`text-content ${Paragraph[1]}`}
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
