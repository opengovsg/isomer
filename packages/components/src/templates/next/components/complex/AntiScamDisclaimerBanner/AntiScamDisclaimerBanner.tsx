import type { AntiScamDisclaimerBannerProps } from "~/interfaces"
import { BiError } from "react-icons/bi"

import { ComponentContent } from "../../internal/customCssClass"
import { Link } from "../../internal/Link"

export const AntiScamDisclaimerBanner = ({
  LinkComponent,
}: AntiScamDisclaimerBannerProps) => {
  return (
    <div
      className={`${ComponentContent} w-full rounded-lg bg-base-canvas px-5 py-12 md:px-6 lg:w-fit lg:max-w-full lg:py-16`}
      role="region"
      aria-label="Anti-scam notice"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-utility-feedback-warning-subtle">
          <BiError
            className="h-5 w-5 text-utility-feedback-warning"
            aria-hidden
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="prose-headline-lg-medium m-0 text-base-content-strong">
            Government officials will never ask you to transfer money over a
            phone call.
          </p>
          <p className="prose-headline-lg-regular m-0 text-base-content-medium">
            If you're unsure if something is a scam, call{" "}
            <Link
              LinkComponent={LinkComponent}
              href="https://www.scamshield.gov.sg"
              isExternal
              showExternalIcon
              isWithFocusVisibleHighlight
              className="text-link underline underline-offset-4 visited:text-link-visited hover:text-link-hover"
            >
              ScamShield
            </Link>{" "}
            at 1799.
          </p>
        </div>
      </div>
    </div>
  )
}
