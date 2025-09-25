import type { HeroProps } from "~/interfaces/complex/Hero"
import { HomepageSearchSGInputBox, LocalSearchInputBox } from "../../internal"
import { ComponentContent } from "../../internal/customCssClass"

export const HeroSearchbar = ({ title, subtitle, site }: HeroProps) => {
  const SearchInputBox = () => {
    const commonProps = {
      className: "w-full pt-3",
    }
    switch (site.search?.type) {
      case "searchSG":
        if (!site.search.clientId) return null
        return (
          <HomepageSearchSGInputBox
            clientId={site.search.clientId}
            {...commonProps}
          />
        )
      case "localSearch":
        if (!site.search.searchUrl) return null
        return (
          <LocalSearchInputBox
            searchUrl={site.search.searchUrl}
            {...commonProps}
          />
        )
      default:
        return null
    }
  }

  return (
    <section
      className="flex w-full flex-col"
      style={{
        background:
          "linear-gradient(275deg, #FFF 6.27%, var(--color-brand-canvas-default) 100%)",
      }}
    >
      <div
        className={`mx-auto flex w-full flex-col gap-6 px-6 pb-12 pt-11 md:gap-9 lg:pb-24 lg:pt-16 ${ComponentContent}`}
      >
        <div className="flex flex-col items-center gap-5 text-center text-base-content-strong md:gap-6 lg:mx-auto lg:max-w-[66.67%]">
          <h1 className="prose-display-xl w-full text-center">{title}</h1>
          {subtitle && (
            <p className="prose-title-lg-regular w-full text-center">
              {subtitle}
            </p>
          )}
          <SearchInputBox />
        </div>
      </div>
    </section>
  )
}
