"use client"

import type { SupportedBrowserBannerProps } from "~/utils/isSupportedBrowser"
import { useSyncExternalStore } from "react"
import { BiInfoCircle } from "react-icons/bi"
import { isSupportedBrowser } from "~/utils/isSupportedBrowser"

// TODO: move this to a official isomer.gov.sg once we migrate that to Isomer Next
const supportedBrowserDocumentLink =
  "https://github.com/opengovsg/isomer/blob/main/packages/components/browser-support.md"

export const UnsupportedBrowserBanner = ({
  userAgent: initialUserAgent,
}: SupportedBrowserBannerProps) => {
  const navigatorUserAgent = useSyncExternalStore(
    () => () => {},
    () =>
      initialUserAgent ||
      (typeof navigator !== "undefined" ? navigator.userAgent : ""),
    () => initialUserAgent || "",
  )

  if (isSupportedBrowser({ userAgent: navigatorUserAgent })) {
    return null
  }

  return (
    <div className="bg-[#FFCC15]">
      <div className="relative mx-auto flex max-w-screen-xl flex-row gap-2 px-6 py-4 text-base-content md:px-10 md:py-4">
        <BiInfoCircle className="mt-[3px] h-4 w-4 shrink-0" />
        <div className="flex flex-1 flex-col gap-0.5">
          <div className="base-content-default prose-headline-base-medium [&:not(:first-child)]:mt-0 [&:not(:last-child)]:mb-0">
            This browser is not supported.
          </div>
          <div className="prose-body-base [&:not(:first-child)]:mt-0 [&:not(:last-child)]:mb-0">
            Your experience on this site might not be ideal. Please update to
            the latest version or use a modern browser to access this site.{" "}
            <a
              href={supportedBrowserDocumentLink}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              View our supported browsers
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  )
}
