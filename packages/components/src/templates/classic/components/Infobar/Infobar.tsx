import type { InfobarProps } from "~/interfaces"
import { BiRightArrowAlt } from "react-icons/bi"

import { HomepageSectionWrapper } from "../HomepageSectionWrapper"

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
      <section className="px-6 py-12">
        <div className="mx-auto flex flex-col items-center gap-3 px-3 pt-10 text-center md:w-1/2">
          <div className="flex flex-col gap-4">
            {subtitle && (
              <p className="text-subtitle tracking-widest uppercase">
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
                className="text-site-secondary flex gap-2 text-center font-semibold tracking-wide uppercase underline"
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
                  <BiRightArrowAlt className="text-site-secondary size-5" />
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
