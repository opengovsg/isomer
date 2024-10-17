"use client"

import { BiInfoCircle } from "react-icons/bi"

import supportedBrowsers from "../../../../../../supportedBrowsers.js"

interface UnsupportedBrowserBannerProps {
  userAgent?: string | undefined
}

const supportedBrowserDocumentLink =
  "https://support.google.com/chrome/answer/95416?hl=en&co=GENIE.Platform%3DAndroid"

const getUserAgent = (): string | undefined => {
  return typeof window !== "undefined" ? window.navigator.userAgent : undefined
}

const isSupportedBrowser = ({ userAgent }: { userAgent?: string }): boolean => {
  return supportedBrowsers.test(userAgent || getUserAgent() || "")
}

export const UnsupportedBrowserBanner = ({
  userAgent,
}: UnsupportedBrowserBannerProps) => {
  if (isSupportedBrowser({ userAgent })) {
    return <></>
  }

  return (
    // TODO: move this into a new utility token
    <div className="bg-[#FFCC15]">
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
