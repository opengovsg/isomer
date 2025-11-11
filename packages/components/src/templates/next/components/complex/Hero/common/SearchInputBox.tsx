import type { HeroProps } from "~/interfaces/complex/Hero"
import {
  HomepageSearchSGInputBox,
  LocalSearchInputBox,
} from "../../../internal"

interface SearchInputBoxProps {
  search: NonNullable<HeroProps["site"]["search"]>
}

export const SearchInputBox = ({ search }: SearchInputBoxProps) => {
  const commonProps = {
    className: "w-full mt-3",
  }
  switch (search?.type) {
    case "searchSG":
      if (!search.clientId) return null
      return (
        <HomepageSearchSGInputBox clientId={search.clientId} {...commonProps} />
      )
    case "localSearch":
      if (!search.searchUrl) return null
      return (
        <LocalSearchInputBox searchUrl={search.searchUrl} {...commonProps} />
      )
    default:
      const _exhaustiveCheck: never = search
      return null
  }
}
