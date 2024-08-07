import { BiRightArrowAlt } from "react-icons/bi"

import type { InfopicProps } from "~/interfaces"
import { HomepageSectionWrapper } from "../HomepageSectionWrapper"

const InfopicContentWrapper = ({
  children,
  shouldShowMobile,
}: {
  children: JSX.Element | JSX.Element[]
  shouldShowMobile: boolean
}) => (
  <div
    className={`mx-auto px-6 py-12 md:grid md:grid-cols-2 md:gap-x-16 md:p-16 xl:max-w-7xl ${
      shouldShowMobile ? "md:hidden" : "hidden"
    }`}
  >
    {children}
  </div>
)

const TextComponent = ({
  title,
  subtitle,
  description,
  buttonLabel,
  buttonUrl,
}: Pick<
  InfopicProps,
  "title" | "subtitle" | "description" | "buttonLabel" | "buttonUrl"
>) => {
  return (
    <div className="flex flex-col gap-4 lg:px-8">
      {subtitle && (
        <p className="uppercase tracking-widest text-subtitle">{subtitle}</p>
      )}
      <h1 className="text-5xl font-semibold text-site-secondary">{title}</h1>
      {description && <p className="text-xl text-paragraph">{description}</p>}
      {buttonLabel && buttonUrl && (
        <div className="tracking-wid text-lg font-semibold uppercase">
          <a
            className="flex gap-2 font-semibold uppercase text-site-secondary underline"
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
              <BiRightArrowAlt className="size-5 text-site-secondary" />
            </div>
          </a>
        </div>
      )}
    </div>
  )
}

const ImageComponent = ({
  imageSrc,
  imageAlt,
}: Pick<InfopicProps, "imageSrc" | "imageAlt">) => {
  return (
    <div className="mt-12 md:row-span-2 md:mt-0">
      <div className="aspect-h-1 aspect-w-1 overflow-hidden rounded-lg">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="h-full w-full object-cover object-center"
        />
      </div>
    </div>
  )
}

const InfoPic = ({
  sectionIndex,
  title,
  subtitle,
  description,
  imageAlt,
  imageSrc,
  buttonLabel,
  buttonUrl,
  isTextOnRight,
}: InfopicProps) => {
  return (
    <HomepageSectionWrapper sectionIndex={sectionIndex}>
      <InfopicContentWrapper shouldShowMobile={false}>
        {isTextOnRight ? (
          <>
            <ImageComponent imageSrc={imageSrc} imageAlt={imageAlt} />
            <TextComponent
              title={title}
              subtitle={subtitle}
              description={description}
              buttonLabel={buttonLabel}
              buttonUrl={buttonUrl}
            />
          </>
        ) : (
          <>
            <TextComponent
              title={title}
              subtitle={subtitle}
              description={description}
              buttonLabel={buttonLabel}
              buttonUrl={buttonUrl}
            />
            <ImageComponent imageSrc={imageSrc} imageAlt={imageAlt} />
          </>
        )}
      </InfopicContentWrapper>
      <InfopicContentWrapper shouldShowMobile>
        <TextComponent
          title={title}
          subtitle={subtitle}
          description={description}
          buttonLabel={buttonLabel}
          buttonUrl={buttonUrl}
        />
        <ImageComponent imageSrc={imageSrc} imageAlt={imageAlt} />
      </InfopicContentWrapper>
    </HomepageSectionWrapper>
  )
}

export default InfoPic
