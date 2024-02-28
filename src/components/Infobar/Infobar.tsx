import { ArrowRightIcon } from "@heroicons/react/24/outline"
import { HomepageSectionWrapper } from "../HomepageSectionWrapper"

export interface InfobarProps {
  sectionIdx?: number
  title?: string
  subtitle?: string
  description?: string
  buttonLabel?: string
  buttonUrl?: string
}

const Infobar = ({
  sectionIdx,
  title,
  subtitle,
  description,
  buttonLabel,
  buttonUrl,
}: InfobarProps) => {
  return (
    <HomepageSectionWrapper sectionIndex={sectionIdx}>
      <section className="py-12 px-6 ">
        <div className="flex flex-col gap-3 mx-auto md:w-1/2 pt-16 px-3 text-center">
          <div className="flex flex-col gap-4">
            {subtitle && (
              <p className="text-subtitle uppercase tracking-widest">
                {subtitle}
              </p>
            )}
            {title && (
              <h1 className="text-secondary text-5xl">
                <b className="font-semibold">{title}</b>
              </h1>
            )}
            {description && (
              <p className="text-paragraph text-xl">{description}</p>
            )}
          </div>
          {buttonLabel && buttonUrl && (
            <div className="text-lg font-semibold uppercase">
              <div className="p-3">
                <a
                  className="inline-flex items-center text-secondary font-semibold text-center underline uppercase tracking-wide"
                  href={buttonUrl}
                >
                  {buttonLabel}
                  <ArrowRightIcon className="text-secondary h-5 w-5 ml-1 mt-1" />
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    </HomepageSectionWrapper>
  )
}

export default Infobar
