"use client"

import { useEffect, useState } from "react"
import { BiInfoCircle } from "react-icons/bi"

import type { SupportedBrowserBannerProps } from "~/utils/isSupportedBrowser"
import { isSupportedBrowser } from "~/utils/isSupportedBrowser"

// TODO: move this to a official isomer.gov.sg once we migrate that to Isomer Next
const supportedBrowserDocumentLink =
  "https://github.com/opengovsg/isomer/blob/main/packages/components/browser-support.md"

export const UnsupportedBrowserBanner = ({
  userAgent: initialUserAgent,
}: SupportedBrowserBannerProps) => {
  const [navigatorUserAgent, setNavigatorUserAgent] = useState(
    initialUserAgent || "",
  )

  useEffect(() => {
    // If no userAgent prop is provided, and we're on the client-side, set navigatorUserAgent from navigator
    // The check for typeof window and navigator ensures this only runs in browser environments, not during server-side rendering
    // We use setNavigatorUserAgent to update the state, which will trigger a re-render with the correct user agent
    if (
      !initialUserAgent &&
      typeof window !== "undefined" &&
      typeof navigator !== "undefined"
    ) {
      setNavigatorUserAgent(navigator.userAgent)
    }
  }, [initialUserAgent])

  if (isSupportedBrowser({ userAgent: navigatorUserAgent })) {
    return <></>
  }

  return (
    <div className="bg-utility-feedback-warning">
      <div className="relative mx-auto flex max-w-screen-xl flex-row gap-4 px-6 py-8 text-base-content md:px-10 md:py-6">
        <BiInfoCircle className="mt-0.5 h-6 w-6 shrink-0" />
        <div className="flex flex-1 flex-col gap-1">
          <div className="base-content-default prose-headline-lg-medium [&:not(:first-child)]:mt-0 [&:not(:last-child)]:mb-0">
            This browser is not supported
          </div>
          <div className="prose-body-base [&:not(:first-child)]:mt-0 [&:not(:last-child)]:mb-0">
            Your experience on this site might not be ideal. Please update to
            the latest version or use a modern browser to access this site.{" "}
            <a
              href={supportedBrowserDocumentLink}
              target="_blank"
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

export default UnsupportedBrowserBanner
