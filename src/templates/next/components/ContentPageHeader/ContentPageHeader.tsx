import { ContentPageHeaderProps } from "~/common"
import Button from "../Button"
import Breadcrumb from "../Breadcrumb"
import Paragraph from "../Paragraph"

const ContentPageHeader = ({
  title,
  summary,
  breadcrumb,
  buttonLabel,
  buttonUrl,
}: ContentPageHeaderProps) => {
  return (
    <div className="bg-primary-100 px-5 py-16">
      <div className="max-w-[848px] flex flex-col gap-8 lg:gap-12 mx-auto">
        <Breadcrumb links={breadcrumb.links} />
        <div className="flex flex-col gap-4 lg:gap-8">
          <h1 className="text-[2.75rem] leading-tight lg:text-[3.75rem] font-semibold text-content-strong">
            {title}
          </h1>
          <div className="lg:text-xl lg:leading-8 text-content-default ">
            <Paragraph content={summary} />
          </div>
        </div>
        {buttonLabel && buttonUrl && (
          <Button
            label={buttonLabel}
            href={buttonUrl}
            rightIcon="right-arrow"
          />
        )}
      </div>
    </div>
  )
}

export default ContentPageHeader
