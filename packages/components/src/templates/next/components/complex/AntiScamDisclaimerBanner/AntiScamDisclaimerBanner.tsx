import { BiError } from "react-icons/bi"

import {
  ANTI_SCAM_DISCLAIMER_AFTER,
  ANTI_SCAM_DISCLAIMER_BEFORE,
  ANTI_SCAM_DISCLAIMER_LINK_HREF,
  ANTI_SCAM_DISCLAIMER_LINK_LABEL,
  ANTI_SCAM_DISCLAIMER_TITLE,
} from "../../antiScamDisclaimerCopy"
import { ComponentContent } from "../../internal/customCssClass"
import { Link } from "../../internal/Link"

export const AntiScamDisclaimerBanner = () => {
  return (
    <div
      className={`${ComponentContent} w-full rounded-lg bg-base-canvas px-5 py-12 md:px-6 lg:w-fit lg:max-w-full lg:py-16`}
      role="region"
      aria-label="Anti-scam notice"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-utility-feedback-warning-faint">
          <BiError
            className="h-5 w-5 text-utility-feedback-warning"
            aria-hidden
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="prose-headline-lg-medium m-0 text-base-content-strong">
            {ANTI_SCAM_DISCLAIMER_TITLE}
          </p>
          <p className="prose-headline-lg-regular m-0 text-base-content-medium">
            {ANTI_SCAM_DISCLAIMER_BEFORE}
            <Link
              href={ANTI_SCAM_DISCLAIMER_LINK_HREF}
              isExternal
              showExternalIcon
              isWithFocusVisibleHighlight
              className="text-link underline underline-offset-4 visited:text-link-visited hover:text-link-hover"
            >
              {ANTI_SCAM_DISCLAIMER_LINK_LABEL}
            </Link>
            {ANTI_SCAM_DISCLAIMER_AFTER}
          </p>
        </div>
      </div>
    </div>
  )
}
