import type { MastheadProps } from "~/interfaces"
import { BiChevronDown } from "react-icons/bi"

import { Link } from "../Link"

const MastheadSummary = ({ isStaging }: { isStaging?: boolean }) => (
  <summary
    aria-label="How to identify official government websites"
    className="group/summary flex w-full cursor-pointer list-none gap-1 text-start leading-5 outline-none lg:flex-row lg:items-center [&::-webkit-details-marker]:hidden"
  >
    <div className="mx-auto flex w-full max-w-screen-xl gap-1 px-6 text-start md:px-10 lg:flex-row lg:items-center">
      <svg
        aria-hidden
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        className="h-7 w-5 flex-shrink-0 fill-[#ef3320]"
      >
        <path d="M5.896 11.185c0 0-0.949 1.341 0.294 3.075 0 0 0.196-0.883 2.159-0.883h2.356c2.225 0 3.893-2.126 2.846-4.319 0 0 1.57 0.164 2.095-0.818 0.523-0.981-0.033-1.374-0.818-1.374h-3.959c0 0 0.704-1.341 0.802-1.341h-2.225c0 0-1.669 0-1.701 1.407 0 0 0.377-0.229 0.752-0.261v0.375c0 0-0.458 0.082-0.671 0.197-0.212 0.114-0.523 0.425-0.228 1.227 0.294 0.801 0.409 1.079 0.409 1.079s0.475-0.41 1.244-0.41h0.9c1.602 0 1.308 1.554-0.295 1.554s-1.815-0.85-1.815-0.85z" />
        <path d="M14.255 9.566c0 0 0.54 0.033 0.932-0.31 0 0 3.55 2.765-1.717 8.326-5.268 5.562-1.195 9.162-1.195 9.162s-0.948 0.915-0.409 2.699c0 0-2.191-1.237-3.867-3.338-2.422-3.036-3.902-7.681 2.749-11.386 0 0 4.389-2.208 3.506-5.153z" />
        <path d="M8.829 6.343c0 0 0.709-1.265 2.355-1.265 1.298 0 1.594-0.666 1.594-0.666s0.566-1.079 3.424-1.079c2.619 0 4.384 0.873 5.812 2.039 0 0-3.85-2.388-7.645 0.971h-5.54z" />
        <path d="M24.839 14.348c-0.109-3.948-3.163-8.179-9.728-7.939 6.413-5.431 17.537 6.695 8.375 13.066 0 0 1.533-2.186 1.353-5.126z" />
        <path d="M16.093 6.845c8.005-0.24 10.863 9.357 5.693 13.676l-5.191 2.509c0 0-0.676-2.181 1.833-4.734 2.509-2.551 4.929-7.328-2.006-10.469 0 0 0.131-0.654-0.327-0.981z" />
        <path d="M15.678 9.004c0 0 0.393-0.371 0.524-0.676 5.954 2.486 5.017 6.697 1.461 10.23-2.181 2.246-1.505 4.668-1.505 4.668s-2.66 1.657-3.577 3.097c0 0-3.852-3.28 1.483-8.724 5.235-5.344 1.614-8.594 1.614-8.594z" />
      </svg>
      <div className="prose-label-sm-regular flex flex-1 flex-wrap gap-1 py-1 text-base-content-medium lg:flex-row">
        <span>
          A Singapore Government Agency Website&nbsp;
          {isStaging === true ? (
            <b>[NOTE: THIS IS A STAGING WEBSITE]&nbsp;</b>
          ) : null}
        </span>
        {/* Focus-visible highlight scoped to the trigger (summary has group/summary) */}
        <span className="not-sr-only text-link underline underline-offset-4 group-hover/summary:text-link-hover group-focus-visible/summary:bg-utility-highlight group-focus-visible/summary:text-base-content-strong group-focus-visible/summary:decoration-transparent group-focus-visible/summary:shadow-focus-visible group-focus-visible/summary:outline-0 group-focus-visible/summary:transition-none group-focus-visible/summary:hover:decoration-transparent">
          How to identify
          <BiChevronDown
            aria-hidden
            className="inline h-4 w-4 shrink-0 rotate-0 transition-transform duration-300 ease-in-out group-open:rotate-180"
          />
        </span>
      </div>
    </div>
  </summary>
)

const RestrictedContent = () => (
  <div className="mx-auto max-w-screen-xl px-6 py-2 pb-8 pt-4 text-[#474747] md:px-10 lg:pb-12 lg:pt-10">
    <div className="grid grid-cols-[1fr] gap-6 px-px lg:grid-cols-[repeat(auto-fit,_minmax(300px,1fr))] lg:gap-40">
      <div className="flex gap-2 text-xs lg:gap-4 lg:text-base">
        <div className="-mt-[0.1rem] lg:mt-[0.2rem]">
          <svg
            aria-hidden
            xmlns="http://www.w3.org/2000/svg"
            width="17"
            height="17"
            viewBox="0 0 17 17"
            fill="none"
            className="w-3 fill-[#242425] lg:w-[1.125rem]"
          >
            <path d="M0.17 5.67V9H1V14H0.17V16.5H1H3.5H5.17H7.67H9.33H11.83H13.5L16 16.5V16.5H16.83V14H16V9H16.83V5.67L8.5 0.67L0.17 5.67ZM3.5 14V9H5.17V14H3.5ZM7.67 14V9H9.33V14H7.67ZM13.5 14H11.83V9H13.5V14ZM10.17 5.67C10.17 6.59 9.42 7.33 8.5 7.33C7.58 7.33 6.83 6.59 6.83 5.67C6.83 4.75 7.58 4 8.5 4C9.42 4 10.17 4.75 10.17 5.67Z" />
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
              href="https://www.gov.sg/trusted-sites#govsites"
              className="inline-flex items-center text-link underline underline-offset-4 outline-none visited:text-link-visited hover:text-link-hover"
              isExternal
              isWithFocusVisibleHighlight
            >
              Trusted websites
              <svg
                aria-hidden
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 32 32"
                className="ml-0.5 w-3 fill-current lg:w-auto"
              >
                <path d="M18.667 4v2.667h4c0.186-0.020 0.374-0.020 0.56 0l-2.667 2.667-6.973 6.987 1.88 1.88 9.733-9.667c0.092 0.257 0.137 0.528 0.133 0.8v4h2.667v-9.333h-9.333z" />
                <path d="M22.667 25.333h-16v-16h8v-2.667h-8c-1.473 0-2.667 1.194-2.667 2.667v16c0 1.473 1.194 2.667 2.667 2.667h16c1.473 0 2.667-1.194 2.667-2.667v-8h-2.667v8z" />
              </svg>
            </Link>
          </article>
        </div>
      </div>
      <div className="flex gap-2 text-xs lg:gap-4 lg:text-base">
        <div className="-mt-[0.1rem]">
          <svg
            aria-hidden
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="18"
            viewBox="0 0 15 18"
            fill="none"
            className="inline-block w-3 fill-[#242425] lg:w-[1.125rem]"
          >
            <path d="M14.17 9C14.17 8.08 13.42 7.33 12.5 7.33H11.67V4.83C11.67 2.54 9.8 0.67 7.5 0.67C5.2 0.67 3.33 2.54 3.33 4.83V7.33H2.5C1.58 7.33 0.83 8.08 0.83 9V15.67C0.83 16.59 1.58 17.33 2.5 17.33H12.5C13.42 17.33 14.17 16.59 14.17 15.67V9ZM5 4.83C5 3.46 6.12 2.33 7.5 2.33C8.88 2.33 10 3.46 10 4.83V7.33H5V4.83Z" />
          </svg>
        </div>
        <div>
          <div className="mb-1 font-semibold lg:mb-2">
            Secure websites use HTTPS
          </div>
          <article>
            Look for a <b>lock</b> (
            <svg
              aria-hidden
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="18"
              viewBox="0 0 15 18"
              fill="none"
              className="mb-[0.1875rem] inline-block h-[0.6rem] w-[0.6rem] fill-[#242425] lg:h-auto lg:w-auto"
            >
              <path d="M14.17 9C14.17 8.08 13.42 7.33 12.5 7.33H11.67V4.83C11.67 2.54 9.8 0.67 7.5 0.67C5.2 0.67 3.33 2.54 3.33 4.83V7.33H2.5C1.58 7.33 0.83 8.08 0.83 9V15.67C0.83 16.59 1.58 17.33 2.5 17.33H12.5C13.42 17.33 14.17 16.59 14.17 15.67V9ZM5 4.83C5 3.46 6.12 2.33 7.5 2.33C8.88 2.33 10 3.46 10 4.83V7.33H5V4.83Z" />
            </svg>
            ) or https:// as an added precaution. Share sensitive information
            only on official, secure websites.
          </article>
        </div>
      </div>
    </div>
  </div>
)

export const Masthead = ({ isStaging }: MastheadProps) => (
  <div className="bg-base-canvas-backdrop">
    <details className="group">
      <MastheadSummary isStaging={isStaging} />
      <RestrictedContent />
    </details>
  </div>
)
