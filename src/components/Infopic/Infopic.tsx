import { ArrowRightIcon } from "@heroicons/react/24/outline"
import { HomepageSectionWrapper } from "../HomepageSectionWrapper"

export interface InfopicProps {
  sectionIndex?: number
  title?: string
  subtitle?: string
  description?: string
  alt?: string
  imageUrl?: string
  buttonLabel?: string
  buttonUrl?: string
  isLeftVariant?: boolean
}

const InfopicContentWrapper = ({
  children,
  shouldShowMobile,
}: {
  children: JSX.Element | JSX.Element[]
  shouldShowMobile: boolean
}) => (
  <div
    className={`mx-auto px-6 py-12 md:grid md:grid-cols-2 md:gap-x-16 md:p-16 xl:max-w-7xl ${
      shouldShowMobile ? "md:hidden" : "sm: hidden"
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
    <div className="flex flex-col gap-4 lg:px-8">
      {subtitle && (
        <p className="text-subtitle uppercase tracking-widest">{subtitle}</p>
      )}
      {title && (
        <h1 className="text-secondary text-5xl font-semibold">{title}</h1>
      )}
      {description && (
        <section aria-labelledby="information-heading">
          <p className="text-paragraph text-xl">{description}</p>
        </section>
      )}
      {buttonLabel && buttonUrl && (
        <div className="text-lg font-semibold uppercase tracking-wid">
          <a
            className="flex gap-2 text-secondary font-semibold underline uppercase"
            href={buttonUrl}
          >
            {buttonLabel}

            <div className="my-auto">
              <ArrowRightIcon className="text-secondary size-5" />
            </div>
          </a>
        </div>
      )}
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
    <div className="mt-12 md:row-span-2 md:mt-0">
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
  isLeftVariant = true,
}: InfopicProps) => {
  return (
    <HomepageSectionWrapper sectionIndex={sectionIndex}>
      <InfopicContentWrapper shouldShowMobile={false}>
        {isLeftVariant ? (
          <>
            <TextComponent
              title={title}
              subtitle={subtitle}
              description={description}
              buttonLabel={button}
              buttonUrl={url}
            />
            <ImageComponent image={image} alt={alt} />
          </>
        ) : (
          <>
            <ImageComponent image={image} alt={alt} />
            <TextComponent
              title={title}
              subtitle={subtitle}
              description={description}
              buttonLabel={button}
              buttonUrl={url}
            />
          </>
        )}
      </InfopicContentWrapper>
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
