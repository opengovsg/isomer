"use client"

import type {
  HomepageSearchSGInputBoxProps,
  NavbarSearchSGInputBoxProps,
  SearchSGInputBoxProps,
} from "~/interfaces"
import { twMerge } from "~/lib/twMerge"
import { useSearchSGScript } from "./useSearchSGScript"

interface BaseSearchSGInputBoxProps {
  clientId: SearchSGInputBoxProps["clientId"]
  className?: string
  shouldLoadScript?: boolean
}
const BaseSearchSGInputBox = ({
  clientId,
  className,
  shouldLoadScript = true,
}: BaseSearchSGInputBoxProps) => {
  useSearchSGScript({ clientId, shouldLoad: shouldLoadScript })

  return (
    <div
      id="searchsg-searchbar"
      className={twMerge("h-[3.25rem] lg:h-16", className)}
    />
  )
}

export const NavbarSearchSGInputBox = ({
  clientId,
  isOpen = false,
}: Omit<NavbarSearchSGInputBoxProps, "type">) => {
  return <BaseSearchSGInputBox clientId={clientId} shouldLoadScript={isOpen} />
}

export const HomepageSearchSGInputBox = ({
  clientId,
  className,
}: Omit<HomepageSearchSGInputBoxProps, "type">) => {
  return (
    <BaseSearchSGInputBox
      clientId={clientId}
      className={className}
      shouldLoadScript={true}
    />
  )
}
