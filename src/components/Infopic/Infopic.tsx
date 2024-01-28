import "@govtechsg/sgds/css/sgds.css"
import { BiRightArrowAlt } from "react-icons/bi"
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
  buttonLabel: button,
  buttonUrl: url,
}: Omit<InfopicProps, "sectionIndex" | "image" | "alt">) => {
  return (
    <div className="lg:max-w-lg">
      <div className="mt-4">
        <div>
          <p className="text-base text-gray-500 uppercase">{subtitle}</p>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {title}
        </h1>
      </div>

      <section aria-labelledby="information-heading" className="mt-4">
        <div className="mt-4 space-y-6">
          <p className="text-base ">{description}</p>
        </div>
      </section>

      <p>
        <a
          href={url}
          className="inline-flex items-center font-medium text-blue-600 dark:text-blue-500 hover:underline"
        >
          {button}
          <BiRightArrowAlt />
        </a>
      </p>
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
    <div className="mt-10  lg:row-span-2 lg:mt-0">
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
