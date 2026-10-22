"use client"

import type { SupportedBrowserBannerProps } from "~/utils/isSupportedBrowser"
import { useEffect, useState } from "react"
import { BiInfoCircle, BiX } from "react-icons/bi"
import { useSessionStorage } from "usehooks-ts"
import { isSupportedBrowser } from "~/utils/isSupportedBrowser"

import { IconButton } from "../IconButton"
import { Link } from "../Link"
import {
  DISMISSED_STORAGE_KEY,
  UNSUPPORTED_BROWSER_BANNER_ID,
  UNSUPPORTED_BROWSER_BANNER_SCRIPT,
} from "./unsupportedBrowserBannerScript"

// TODO: move this to a official isomer.gov.sg once we migrate that to Isomer Next
const supportedBrowserDocumentLink =
  "https://github.com/opengovsg/isomer/blob/main/packages/components/browser-support.md"

export const UnsupportedBrowserBanner = ({
  userAgent: initialUserAgent,
}: SupportedBrowserBannerProps) => {
  const [isDismissed, setIsDismissed] = useSessionStorage(
    DISMISSED_STORAGE_KEY,
    false,
  )
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

  const isHidden =
    isDismissed || isSupportedBrowser({ userAgent: navigatorUserAgent })

  // Always rendered so the inline script can reveal it in browsers that never
  // hydrate; the script may flip `hidden` before hydration, hence the warning suppression.
  return (
    <>
      <div
        id={UNSUPPORTED_BROWSER_BANNER_ID}
        hidden={isHidden}
        suppressHydrationWarning
        className="bg-[#FFCC15]"
        role="region"
        aria-label="Unsupported browser notice"
      >
        <div className="relative mx-auto flex max-w-screen-xl flex-row gap-4 px-6 py-4 text-base-content md:px-10 md:py-4">
          <div className="flex flex-row gap-2">
            <BiInfoCircle className="mt-[3px] h-4 w-4 shrink-0" aria-hidden />
            <div className="flex flex-1 flex-col gap-0.5">
              <div className="base-content-default prose-headline-base-medium [&:not(:first-child)]:mt-0 [&:not(:last-child)]:mb-0">
                This browser is not supported.
              </div>
              <div className="prose-body-base [&:not(:first-child)]:mt-0 [&:not(:last-child)]:mb-0">
                Your experience on this site might not be ideal. Please update
                to the latest version or use a modern browser to access this
                site.{" "}
                <Link
                  href={supportedBrowserDocumentLink}
                  isExternal
                  className="underline"
                >
                  View our supported browsers
                </Link>
                .
              </div>
            </div>
          </div>
          <div aria-hidden className="flex h-6 w-6 shrink-0" />
          <IconButton
            onPress={() => setIsDismissed(true)}
            icon={BiX}
            className="absolute right-3 top-1 md:right-7"
            aria-label="Dismiss unsupported browser banner temporarily"
          />
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{ __html: UNSUPPORTED_BROWSER_BANNER_SCRIPT }}
      />
    </>
  )
}
