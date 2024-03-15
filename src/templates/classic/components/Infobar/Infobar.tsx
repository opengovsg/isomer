import { ArrowRightIcon } from "@heroicons/react/24/outline"
import { HomepageSectionWrapper } from "../HomepageSectionWrapper"
import { InfobarProps } from "~/common"

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
        <div className="flex flex-col gap-3 items-center mx-auto md:w-1/2 pt-10 px-3 text-center">
          <div className="flex flex-col gap-4">
            {subtitle && (
              <p className="text-subtitle uppercase tracking-widest">
                {subtitle}
              </p>
            )}
            <h1 className="text-site-secondary text-5xl">
              <b className="font-semibold">{title}</b>
            </h1>
            {description && (
              <p className="text-paragraph text-xl">{description}</p>
            )}
          </div>
          {buttonLabel && buttonUrl && (
            <div className="p-3 text-lg font-semibold uppercase">
              <a
                className="flex gap-2 text-site-secondary font-semibold text-center underline uppercase tracking-wide"
                href={buttonUrl}
                target={buttonUrl.startsWith("http") ? "_blank" : undefined}
                rel={
                  buttonUrl.startsWith("http")
                    ? "noopener noreferrer nofollow"
                    : undefined
                }
              >
                {buttonLabel}
                <div className="my-auto">
                  <ArrowRightIcon className="text-site-secondary size-5" />
                </div>
              </a>
            </div>
          )}
        </div>
      </section>
    </HomepageSectionWrapper>
  )
}

export default Infobar
