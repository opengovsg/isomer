import type { HeroSearchbarProps } from "~/interfaces/complex/Hero"
import { DynamicHeading } from "~/utils/DynamicHeading"
import { hasNonEmptyString } from "~/utils/truthiness"

import { ComponentContent } from "../../../internal/customCssClass"
import { LocalSearchInputBox } from "../../../internal/LocalSearchInputBox"
import { HomepageSearchSGInputBox } from "../../../internal/SearchSGInputBox"

const SEARCH_INPUT_COMMON_PROPS = {
  className: "w-full mt-3",
}

interface SearchInputBoxProps {
  search: NonNullable<HeroSearchbarProps["site"]["search"]>
}
const SearchInputBox = ({ search }: SearchInputBoxProps) => {
  switch (search.type) {
    case "searchSG": {
      if (!search.clientId) {
        return null
      }
      return (
        <HomepageSearchSGInputBox
          clientId={search.clientId}
          {...SEARCH_INPUT_COMMON_PROPS}
        />
      )
    }
    case "localSearch": {
      if (!search.searchUrl) {
        return null
      }
      return (
        <LocalSearchInputBox
          searchUrl={search.searchUrl}
          {...SEARCH_INPUT_COMMON_PROPS}
        />
      )
    }
    case "egazette-algolia": {
      // Egazette Algolia search runs on a dedicated search page, not from the Hero searchbar.
      return null
    }
    default: {
      const _exhaustiveCheck: never = search
      return null
    }
  }
}

export const SearchbarContent = ({
  title,
  subtitle,
  site,
  headingLevel,
}: HeroSearchbarProps) => (
  <div
    className={`relative mx-auto flex w-full flex-col items-center gap-6 px-6 pb-12 pt-11 md:gap-9 lg:pb-20 lg:pt-16 ${ComponentContent}`}
  >
    <div className="flex w-full max-w-[760px] flex-col items-center gap-5 text-center md:gap-6">
      <DynamicHeading
        level={headingLevel}
        className="prose-display-lg w-full text-center"
      >
        {title}
      </DynamicHeading>
      {hasNonEmptyString(subtitle) && (
        <p className="prose-title-lg-regular w-full text-center">{subtitle}</p>
      )}
      {site.search && <SearchInputBox search={site.search} />}
    </div>
  </div>
)
