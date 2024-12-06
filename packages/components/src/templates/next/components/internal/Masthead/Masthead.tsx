"use client"

import type { PropsWithChildren } from "react"
import { createContext, useContext, useState } from "react"
import { Button, composeRenderProps } from "react-aria-components"
import { BiChevronDown } from "react-icons/bi"

import type { MastheadProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { focusVisibleHighlight } from "~/utils/rac"
import { Link } from "../Link"

const MASTHEAD_CONTROL_ID = "govt-masthead-expandable"

const mastheadButtonStyle = tv({
  extend: focusVisibleHighlight,
  base: "",
})

type MastheadProviderProps = Omit<MastheadProps, "type">
interface MastheadContextReturn extends MastheadProviderProps {
  isMastheadContentVisible: boolean
  toggleMastheadContent: () => void
}

const MastheadContext = createContext<MastheadContextReturn | null>(null)
const MastheadProvider = ({
  children,
  LinkComponent,
  isStaging,
}: PropsWithChildren<MastheadProviderProps>) => {
  const [isMastheadContentVisible, setIsMastheadContentVisible] =
    useState(false)

  const toggleMastheadContent = () => {
    setIsMastheadContentVisible((prev) => !prev)
  }

  return (
    <MastheadContext.Provider
      value={{
        isMastheadContentVisible,
        toggleMastheadContent,
        LinkComponent,
        isStaging,
      }}
    >
      {children}
    </MastheadContext.Provider>
  )
}

const useMasthead = () => {
  const context = useContext(MastheadContext)
  if (context === null) {
    throw new Error("useMasthead must be used within a MastheadProvider")
  }
  return context
}

const RestrictedHeaderBarContent = ({ children }: PropsWithChildren) => {
  const { isStaging } = useMasthead()
  return (
    <>
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        className="h-7 w-5 flex-shrink-0 fill-[#ef3320]"
      >
        <path d="M5.896 11.185c0 0-0.949 1.341 0.294 3.075 0 0 0.196-0.883 2.159-0.883h2.356c2.225 0 3.893-2.126 2.846-4.319 0 0 1.57 0.164 2.095-0.818 0.523-0.981-0.033-1.374-0.818-1.374h-3.959c0 0.704-1.341 0.802-1.341 0h-2.225c0 0-1.669 0-1.701 1.407 0 0 0.377-0.229 0.752-0.261v0.375c0 0-0.458 0.082-0.671 0.197-0.212 0.114-0.523 0.425-0.228 1.227 0.294 0.801 0.409 1.079 0.409 1.079s0.475-0.41 1.244-0.41h0.9c1.602 0 1.308 1.554-0.295 1.554s-1.815-0.85-1.815-0.85z"></path>
        <path d="M14.255 9.566c0 0 0.54 0.033 0.932-0.31 0 0 3.55 2.765-1.717 8.326-5.268 5.562-1.195 9.162-1.195 9.162s-0.948 0.915-0.409 2.699c0 0-2.191-1.237-3.867-3.338-2.422-3.036-3.902-7.681 2.749-11.386 0 0 4.389-2.208 3.506-5.153z"></path>
        <path d="M8.829 6.343c0 0 0.709-1.265 2.355-1.265 1.298 0 1.594-0.666 1.594-0.666s0.566-1.079 3.424-1.079c2.619 0 4.384 0.873 5.812 2.039 0 0-3.85-2.388-7.645 0.971h-5.54z"></path>
        <path d="M24.839 14.348c-0.109-3.948-3.163-8.179-9.728-7.939 6.413-5.431 17.537 6.695 8.375 13.066 0 0 1.533-2.186 1.353-5.126z"></path>
        <path d="M16.093 6.845c8.005-0.24 10.863 9.357 5.693 13.676l-5.191 2.509c0 0-0.676-2.181 1.833-4.734 2.509-2.551 4.929-7.328-2.006-10.469 0 0 0.131-0.654-0.327-0.981z"></path>
        <path d="M15.678 9.004c0 0 0.393-0.371 0.524-0.676 5.954 2.486 5.017 6.697 1.461 10.23-2.181 2.246-1.505 4.668-1.505 4.668s-2.66 1.657-3.577 3.097c0 0-3.852-3.28 1.483-8.724 5.235-5.344 1.614-8.594 1.614-8.594z"></path>
      </svg>
      <div className="prose-label-sm-regular flex flex-1 flex-wrap gap-1 py-1 text-base-content-medium lg:flex-row">
        <span>
          A Singapore Government Agency Website&nbsp;
          {isStaging ? <b>[NOTE: THIS IS A STAGING WEBSITE]&nbsp;</b> : null}
        </span>
        {children}
      </div>
    </>
  )
}

const RestrictedHeaderBar = ({ children }: PropsWithChildren) => {
  const { isMastheadContentVisible, toggleMastheadContent } = useMasthead()
  return (
    <div className="mx-auto max-w-screen-xl px-6 md:px-10">
      <Button
        className={composeRenderProps(
          "group flex w-full gap-1 text-start leading-5 outline-none lg:hidden",
          (className, renderProps) =>
            mastheadButtonStyle({ className, ...renderProps }),
        )}
        aria-controls={MASTHEAD_CONTROL_ID}
        aria-describedby="masthead-aria"
        aria-expanded={isMastheadContentVisible}
        onPress={toggleMastheadContent}
      >
        {children}
        <span className="sr-only" id="masthead-aria">
          {isMastheadContentVisible
            ? "Click to collapse masthead"
            : "Click to expand masthead to find out how to identify an official government website"}
        </span>
        <RestrictedHeaderBarContent>
          <span className="not-sr-only text-link underline group-hover:text-link-hover">
            How to identify
            <BiChevronDown
              aria-hidden
              className={`inline h-4 w-4 shrink-0 transition-all duration-300 ease-in-out ${
                isMastheadContentVisible ? "rotate-180" : "rotate-0"
              }`}
            />
          </span>
        </RestrictedHeaderBarContent>
      </Button>
      {/* Desktop variant */}
      <div className="hidden items-center gap-1 lg:flex">
        <RestrictedHeaderBarContent>
          <Button
            className={composeRenderProps(
              "hidden flex-row items-center text-link underline underline-offset-4 outline-0 transition-colors hover:text-link-hover focus-visible:text-content-strong lg:flex",
              (className, renderProps) =>
                mastheadButtonStyle({ className, ...renderProps }),
            )}
            onPress={toggleMastheadContent}
          >
            How to identify
            <BiChevronDown
              aria-hidden
              className={`h-4 w-4 shrink-0 transition-transform ease-in-out ${
                isMastheadContentVisible ? "rotate-180" : "rotate-0"
              }`}
            />
          </Button>
        </RestrictedHeaderBarContent>
      </div>
    </div>
  )
}

const RestrictedContent = () => {
  const { isMastheadContentVisible, LinkComponent } = useMasthead()

  return (
    <div
      id={MASTHEAD_CONTROL_ID}
      className={`mx-auto max-w-screen-xl px-6 py-2 pb-8 pt-4 text-[#474747] md:px-10 lg:pb-12 lg:pt-10 ${
        isMastheadContentVisible ? "block" : "hidden"
      }`}
    >
      <div className="grid grid-cols-[1fr] gap-6 px-px lg:grid-cols-[repeat(auto-fit,_minmax(300px,1fr))] lg:gap-40">
        <div className="flex gap-2 text-[0.6875rem] lg:gap-4 lg:text-base">
          <div className="-mt-[0.1rem] lg:mt-[0.2rem]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="17"
              height="17"
              viewBox="0 0 17 17"
              fill="none"
              className="w-3 fill-[#242425] lg:w-[1.125rem]"
            >
              <path d="M0.166016 5.6665V9.00067H0.999349V13.9998H0.166016V16.4998H0.999349H3.49935H5.16602H7.66601H9.33268H11.8327H13.4993L15.9993 16.5007V16.4998H16.8327V13.9998H15.9993V9.00067H16.8327V5.6665L8.49935 0.666504L0.166016 5.6665ZM3.49935 13.9998V9.00067H5.16602V13.9998H3.49935ZM7.66601 13.9998V9.00067H9.33268V13.9998H7.66601ZM13.4993 13.9998H11.8327V9.00067H13.4993V13.9998ZM10.166 5.6665C10.166 6.58651 9.41935 7.33317 8.49935 7.33317C7.57935 7.33317 6.83268 6.58651 6.83268 5.6665C6.83268 4.7465 7.57935 3.99984 8.49935 3.99984C9.41935 3.99984 10.166 4.7465 10.166 5.6665Z"></path>
            </svg>
          </div>
          <div>
            <div className="mb-1 font-semibold lg:mb-2">
              Official website links end with .gov.sg
            </div>
            <article className="leading-[1.2rem] lg:leading-6">
              Government agencies communicate via .gov.sg websites (e.g.
              go.gov.sg/open).&nbsp;
              <Link
                LinkComponent={LinkComponent}
                href="https://www.gov.sg/trusted-sites#govsites"
                className="visited:text-link-visited inline-flex items-center text-link underline underline-offset-4 outline-none hover:text-link-hover"
                isExternal
                isWithFocusVisibleHighlight
              >
                Trusted websites
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 32 32"
                  className="ml-0.5 w-3 fill-current lg:w-auto"
                >
                  <path d="M18.667 4v2.667h4c0.186-0.020 0.374-0.020 0.56 0l-2.667 2.667-6.973 6.987 1.88 1.88 9.733-9.667c0.092 0.257 0.137 0.528 0.133 0.8v4h2.667v-9.333h-9.333z"></path>
                  <path d="M22.667 25.333h-16v-16h8v-2.667h-8c-1.473 0-2.667 1.194-2.667 2.667v16c0 1.473 1.194 2.667 2.667 2.667h16c1.473 0 2.667-1.194 2.667-2.667v-8h-2.667v8z"></path>
                </svg>
              </Link>
            </article>
          </div>
        </div>
        <div className="flex gap-2 text-[0.6875rem] lg:gap-4 lg:text-base">
          <div className="-mt-[0.1rem]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="18"
              viewBox="0 0 15 18"
              fill="none"
              className="inline-block w-3 fill-[#242425] lg:w-[1.125rem]"
            >
              <path d="M14.1663 9.00008C14.1663 8.08091 13.4188 7.33342 12.4997 7.33342H11.6663V4.83342C11.6663 2.53591 9.79717 0.666748 7.49967 0.666748C5.20217 0.666748 3.33301 2.53591 3.33301 4.83342V7.33342H2.49967C1.58051 7.33342 0.833008 8.08091 0.833008 9.00008V15.6667C0.833008 16.5859 1.58051 17.3334 2.49967 17.3334H12.4997C13.4188 17.3334 14.1663 16.5859 14.1663 15.6667V9.00008ZM4.99967 4.83342C4.99967 3.45508 6.12134 2.33341 7.49967 2.33341C8.87801 2.33341 9.99967 3.45508 9.99967 4.83342V7.33342H4.99967V4.83342Z"></path>
            </svg>
          </div>
          <div>
            <div className="mb-1 font-semibold lg:mb-2">
              Secure websites use HTTPS
            </div>
            <article>
              Look for a <b>lock</b> (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="18"
                viewBox="0 0 15 18"
                fill="none"
                className="mb-[0.1875rem] inline-block h-[0.6rem] w-[0.6rem] fill-[#242425] lg:h-auto lg:w-auto"
              >
                <path d="M14.1663 9.00008C14.1663 8.08091 13.4188 7.33342 12.4997 7.33342H11.6663V4.83342C11.6663 2.53591 9.79717 0.666748 7.49967 0.666748C5.20217 0.666748 3.33301 2.53591 3.33301 4.83342V7.33342H2.49967C1.58051 7.33342 0.833008 8.08091 0.833008 9.00008V15.6667C0.833008 16.5859 1.58051 17.3334 2.49967 17.3334H12.4997C13.4188 17.3334 14.1663 16.5859 14.1663 15.6667V9.00008ZM4.99967 4.83342C4.99967 3.45508 6.12134 2.33341 7.49967 2.33341C8.87801 2.33341 9.99967 3.45508 9.99967 4.83342V7.33342H4.99967V4.83342Z"></path>
              </svg>
              ) or https:// as an added precaution. Share sensitive information
              only on official, secure websites.
            </article>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Masthead = (props: Omit<MastheadProps, "type">) => {
  return (
    <MastheadProvider {...props}>
      <div className="bg-base-canvas-backdrop">
        <RestrictedHeaderBar />
        <RestrictedContent />
      </div>
    </MastheadProvider>
  )
}

export default Masthead
