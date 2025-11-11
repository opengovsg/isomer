import type { HeroProps } from "~/interfaces/complex/Hero"
import { ComponentContent } from "../../internal/customCssClass"
import { SearchInputBox } from "./common/SearchInputBox"

export const HeroSearchbar = ({ title, subtitle, site }: HeroProps) => {
  return (
    <section
      className="flex w-full flex-col justify-center md:min-h-80 lg:min-h-96"
      style={{
        background:
          "linear-gradient(275deg, #FFF 6.27%, var(--color-brand-canvas-default) 100%)",
      }}
    >
      <div
        className={`mx-auto flex w-full flex-col gap-6 px-6 pb-12 pt-11 md:gap-9 lg:pb-20 lg:pt-16 ${ComponentContent}`}
      >
        <div className="flex flex-col items-center gap-5 text-center text-base-content-strong md:gap-6 lg:mx-auto lg:max-w-[66.67%]">
          <h1 className="prose-display-lg w-full text-center">{title}</h1>
          {subtitle && (
            <p className="prose-title-lg-regular w-full text-center">
              {subtitle}
            </p>
          )}
          {site.search && <SearchInputBox search={site.search} />}
        </div>
      </div>
    </section>
  )
}
