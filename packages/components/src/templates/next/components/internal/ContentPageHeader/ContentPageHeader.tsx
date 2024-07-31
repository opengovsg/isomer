import type { ContentPageHeaderProps } from "~/interfaces"
import { getFormattedDate } from "~/utils"
import Button from "../../complex/Button"
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
    <div className="bg-site-secondary-100 text-base-content-strong">
      <div className="mx-auto flex max-w-screen-xl flex-col gap-8 px-6 py-8 md:px-10">
        <div className="flex flex-col">
          <Breadcrumb links={breadcrumb.links} LinkComponent={LinkComponent} />
          <div className="mt-8 flex flex-col gap-5 md:mt-6">
            <h1 className="prose-display-lg">{title}</h1>
            <p className="prose-title-lg-regular">{summary}</p>
          </div>
          {buttonLabel && buttonUrl && (
            <div className="mt-9">
              <Button
                label={buttonLabel}
                href={buttonUrl}
                rightIcon="right-arrow"
                LinkComponent={LinkComponent}
              />
            </div>
          )}
        </div>
        <div className="prose-body-sm text-base-content-subtle">{`Last updated ${getFormattedDate(lastUpdated)}`}</div>
      </div>
    </div>
  )
}

export default ContentPageHeader
