import type { AntiScamDisclaimerBannerProps } from "~/interfaces"
import { BiShield } from "react-icons/bi"

import { ComponentContent } from "../../internal/customCssClass"

export const AntiScamDisclaimerBanner = ({
  LinkComponent,
}: AntiScamDisclaimerBannerProps) => {
  return (
    <div
      className={`${ComponentContent} bg-utility-feedback-warning-subtle rounded-lg border border-utility-feedback-warning px-5 py-4 md:px-6 md:py-5 [&:not(:first-child)]:mt-7`}
      role="region"
      aria-label="Anti-scam notice"
    >
      <div className="flex flex-col gap-3 md:flex-row md:gap-4">
        <BiShield
          className="mt-0.5 h-6 w-6 shrink-0 text-utility-feedback-warning"
          aria-hidden
        />
        <p className="prose-body-base text-base-content [&:not(:first-child)]:mt-0 [&:not(:last-child)]:mb-0">
          Anti-scam disclaimer banner (content to be configured).
        </p>
      </div>
    </div>
  )
}
