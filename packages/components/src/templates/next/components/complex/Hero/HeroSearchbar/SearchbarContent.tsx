import type { HeroSearchbarProps } from "~/interfaces/complex/Hero"
import { twMerge } from "~/lib/twMerge"

import { ComponentContent } from "../../../internal/customCssClass"
import { LocalSearchInputBox } from "../../../internal/LocalSearchInputBox"
import { HomepageSearchSGInputBox } from "../../../internal/SearchSGInputBox"

interface SearchInputBoxProps {
  search: NonNullable<HeroSearchbarProps["site"]["search"]>
}
const SearchInputBox = ({ search }: SearchInputBoxProps) => {
  const commonProps = {
    className: "w-full mt-3",
  }
  switch (search.type) {
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
    case "egazette-algolia":
      // Egazette Algolia search runs on a dedicated search page, not from the Hero searchbar.
      return null
    default:
      const _exhaustiveCheck: never = search
      return null
  }
}

export const SearchbarContent = ({
  title,
  subtitle,
  site,
}: HeroSearchbarProps) => {
  return (
    <div
      className={twMerge(
        "relative mx-auto flex w-full flex-col items-center gap-6 px-6 pt-11 pb-12 md:gap-9 lg:pt-16 lg:pb-20",
        ComponentContent,
      )}
    >
      <div className="flex w-full max-w-[760px] flex-col items-center gap-5 text-center md:gap-6">
        <h1 className="prose-display-lg w-full text-center">{title}</h1>
        {!!subtitle && (
          <p className="prose-title-lg-regular w-full text-center">
            {subtitle}
          </p>
        )}
        {site.search && <SearchInputBox search={site.search} />}
      </div>
    </div>
  )
}
