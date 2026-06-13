import { BiError } from "react-icons/bi"

import { ComponentContent } from "../../internal/customCssClass"
import { Link } from "../../internal/Link"

export const AntiScamDisclaimerBanner = () => {
  return (
    <div
      className={`${ComponentContent} bg-base-canvas w-full rounded-lg px-5 py-12 md:px-6 lg:w-fit lg:max-w-full lg:py-16`}
      role="region"
      aria-label="Anti-scam notice"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="bg-utility-feedback-warning-subtle flex size-11 shrink-0 items-center justify-center rounded-full">
          <BiError
            className="text-utility-feedback-warning h-5 w-5"
            aria-hidden
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="prose-headline-lg-medium text-base-content-strong m-0">
            Government officials will never ask you to transfer money over a
            phone call.
          </p>
          <p className="prose-headline-lg-regular text-base-content-medium m-0">
            If you're unsure if something is a scam, call{" "}
            <Link
              href="https://www.scamshield.gov.sg"
              isExternal
              showExternalIcon
              isWithFocusVisibleHighlight
              className="text-link visited:text-link-visited hover:text-link-hover underline underline-offset-4"
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
