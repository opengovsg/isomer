import type { HeroSearchbarProps } from "~/interfaces/complex/Hero"
import {
  HomepageSearchSGInputBox,
  LocalSearchInputBox,
} from "../../../internal"
import { ComponentContent } from "../../../internal/customCssClass"

interface SearchInputBoxProps {
  search: NonNullable<HeroSearchbarProps["site"]["search"]>
}
const SearchInputBox = ({ search }: SearchInputBoxProps) => {
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

export const SearchbarContent = ({
  title,
  subtitle,
  site,
}: HeroSearchbarProps) => {
  return (
    <div
      className={`relative mx-auto flex w-full flex-col items-center gap-6 px-6 pb-12 pt-11 md:gap-9 lg:pb-20 lg:pt-16 ${ComponentContent}`}
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
