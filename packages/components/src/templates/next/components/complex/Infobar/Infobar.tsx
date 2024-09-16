import type { InfobarProps } from "~/interfaces"
import { getReferenceLinkHref } from "~/utils"
import { ComponentContent } from "../../internal/customCssClass"
import { LinkButton } from "../../internal/LinkButton"

const Infobar = ({
  title,
  description,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  site,
  LinkComponent,
}: InfobarProps) => {
  return (
    <section>
      <div className={`${ComponentContent} mx-6 py-16 sm:mx-10 lg:py-24`}>
        <div className="mx-auto flex flex-col items-center gap-9 text-center lg:max-w-3xl">
          <div className="flex flex-col gap-6">
            <h2 className="prose-display-lg break-words text-base-content-strong">
              {title}
            </h2>
            {description && (
              <p className="prose-headline-lg-regular text-base-content">
                {description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-center gap-x-5 gap-y-4 sm:flex-row">
            {buttonLabel && buttonUrl && (
              <LinkButton
                href={getReferenceLinkHref(buttonUrl, site.siteMap)}
                LinkComponent={LinkComponent}
              >
                {buttonLabel}
              </LinkButton>
            )}
            {secondaryButtonLabel && secondaryButtonUrl && (
              <LinkButton
                href={getReferenceLinkHref(secondaryButtonUrl, site.siteMap)}
                variant="outline"
                LinkComponent={LinkComponent}
              >
                {secondaryButtonLabel}
              </LinkButton>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Infobar
