import { ArrowRightIcon } from "@heroicons/react/24/outline"
import { HomepageSectionWrapper } from "../HomepageSectionWrapper"

export interface InfopicProps {
  sectionIndex: number
  title?: string
  subtitle?: string
  description?: string
  alt?: string
  imageUrl?: string
  buttonLabel?: string
  buttonUrl?: string
}

const InfopicContentWrapper = ({
  children,
  shouldShowMobile,
}: {
  children: JSX.Element | JSX.Element[]
  shouldShowMobile: boolean
}) => (
  <div
    className={`mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8 ${
      shouldShowMobile ? "block lg:!hidden" : "hidden lg:!grid"
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
}: Omit<InfopicProps, "sectionIndex" | "image" | "alt">) => {
  return (
    <div className="lg:max-w-lg">
      <div className="mt-4">
        <div>
          <p className="text-subtitle pb-4 uppercase tracking-widest">
            {subtitle}
          </p>
        </div>
        <h1 className="text-secondary text-5xl font-semibold pb-4">{title}</h1>
      </div>

      <section aria-labelledby="information-heading" className="mt-4">
        <div className="mt-4 space-y-6">
          <p className="text-paragraph text-xl">{description}</p>
        </div>
      </section>

      <div className="pb-4 text-lg font-semibold uppercase tracking-wid">
        <a
          className="inline-flex text-secondary font-semibold text-center underline uppercase pt-4"
          href={buttonUrl}
        >
          {buttonLabel}

          <ArrowRightIcon className="text-secondary h-5 w-5 ml-1 mt-1" />
        </a>
      </div>
    </div>
  )
}

const ImageComponent = ({
  image,
  alt,
}: {
  image: InfopicProps["imageUrl"]
  alt: InfopicProps["alt"]
}) => {
  return (
    <div className="mt-10 lg:row-span-2 lg:mt-0">
      <div className="aspect-h-1 aspect-w-1 overflow-hidden rounded-lg">
        <img
          src={image}
          alt={alt}
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
  alt,
  imageUrl: image,
  buttonLabel: button,
  buttonUrl: url,
}: InfopicProps) => {
  return (
    <HomepageSectionWrapper sectionIndex={sectionIndex}>
      {sectionIndex % 2 === 0 ? (
        <InfopicContentWrapper shouldShowMobile={false}>
          <TextComponent
            title={title}
            subtitle={subtitle}
            description={description}
            buttonLabel={button}
            buttonUrl={url}
          />
          <ImageComponent image={image} alt={alt} />
        </InfopicContentWrapper>
      ) : (
        <InfopicContentWrapper shouldShowMobile={false}>
          <ImageComponent image={image} alt={alt} />
          <TextComponent
            title={title}
            subtitle={subtitle}
            description={description}
            buttonLabel={button}
            buttonUrl={url}
          />
        </InfopicContentWrapper>
      )}
      <InfopicContentWrapper shouldShowMobile>
        <TextComponent
          title={title}
          subtitle={subtitle}
          description={description}
          buttonLabel={button}
          buttonUrl={url}
        />
        <ImageComponent image={image} alt={alt} />
      </InfopicContentWrapper>
    </HomepageSectionWrapper>
  )
}

export default InfoPic
