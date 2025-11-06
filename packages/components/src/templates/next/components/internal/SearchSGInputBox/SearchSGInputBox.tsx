import type {
  HomepageSearchSGInputBoxProps,
  NavbarSearchSGInputBoxProps,
  SearchSGInputBoxProps,
} from "~/interfaces"
import { twMerge } from "~/lib/twMerge"
import { SearchSGInputBoxClient } from "./SearchSGInputBoxClient"

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
  // Compute on server so twMerge is not bundled on the client
  const mergedClassName = twMerge("h-[3.25rem] lg:h-16", className)

  return (
    <SearchSGInputBoxClient
      clientId={clientId}
      className={mergedClassName}
      shouldLoadScript={shouldLoadScript}
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
