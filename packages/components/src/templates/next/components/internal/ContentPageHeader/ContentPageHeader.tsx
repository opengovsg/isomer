import type { ContentPageHeaderProps } from "~/interfaces"
import { getFormattedDate, getReferenceLinkHref } from "~/utils"
import Breadcrumb from "../Breadcrumb"
import { LinkButton } from "../LinkButton"

const ContentPageHeader = ({
  title,
  summary,
  lastUpdated,
  breadcrumb,
  buttonLabel,
  buttonUrl,
  site,
  LinkComponent,
}: ContentPageHeaderProps) => {
  return (
    <div className="bg-brand-canvas text-base-content-strong">
      <div className="mx-auto flex max-w-screen-xl flex-col gap-8 px-6 py-8 md:px-10">
        <div className="flex max-w-[54rem] flex-col">
          <Breadcrumb links={breadcrumb.links} LinkComponent={LinkComponent} />
          <div className="mt-8 flex flex-col gap-5 md:mt-6">
            <h1 className="prose-display-lg break-words">{title}</h1>
            <p className="prose-title-lg-regular">{summary}</p>
          </div>
          {buttonLabel && buttonUrl && (
            <div className="mt-9">
              <LinkButton
                href={getReferenceLinkHref(
                  buttonUrl,
                  site.siteMap,
                  site.assetsBaseUrl,
                )}
                LinkComponent={LinkComponent}
                isWithFocusVisibleHighlight
              >
                {buttonLabel}
              </LinkButton>
            </div>
          )}
        </div>
        <div className="prose-body-sm text-base-content-subtle">{`Last updated ${getFormattedDate(lastUpdated)}`}</div>
      </div>
    </div>
  )
}

export default ContentPageHeader
