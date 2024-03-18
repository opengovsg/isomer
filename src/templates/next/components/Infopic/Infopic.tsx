import { InfopicProps } from "~/common"
import Button from "../Button"

const TextComponent = ({
  title,
  description,
  buttonLabel,
  buttonUrl,
  className,
}: Omit<InfopicProps, "type" | "sectionIndex" | "imageSrc" | "imageAlt"> & {
  className?: string
}) => {
  return (
    <div className={`flex flex-col gap-10 ${className ?? ""}`}>
      <div className="flex flex-col gap-4 sm:gap-6">
        <h1 className="text-content text-2xl font-semibold sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="text-content text-sm sm:text-lg">{description}</p>
        )}
      </div>
      {buttonLabel && buttonUrl && (
        <Button label={buttonLabel} href={buttonUrl} rightIcon="right-arrow" />
      )}
    </div>
  )
}

const ImageComponent = ({
  src,
  alt,
  className,
}: {
  src: InfopicProps["imageSrc"]
  alt: InfopicProps["imageAlt"]
  className?: string
}) => {
  return (
    <div className={`aspect-h-1 aspect-w-1 overflow-hidden ${className ?? ""}`}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-center"
      />
    </div>
  )
}

const SideBySideInfoPic = ({
  title,
  description,
  imageAlt: alt,
  imageSrc: src,
  buttonLabel: button,
  buttonUrl: url,
  isTextOnRight,
}: InfopicProps) => {
  return (
    <>
      {/* Mobile-Tablet */}
      <div className="py-16 px-6 flex flex-col gap-14 sm:py-24 sm:px-14 lg:hidden">
        <TextComponent
          title={title}
          description={description}
          buttonLabel={button}
          buttonUrl={url}
        />
        <ImageComponent src={src} alt={alt} />
      </div>
      {/* Desktop */}
      {isTextOnRight ? (
        <div className="hidden lg:flex flex-row gap-14 py-24 px-10">
          <ImageComponent src={src} alt={alt} className="w-1/3" />
          <TextComponent
            title={title}
            description={description}
            buttonLabel={button}
            buttonUrl={url}
            className="w-2/3"
          />
        </div>
      ) : (
        <div className="hidden lg:flex flex-row gap-14 py-24 px-10">
          <TextComponent
            title={title}
            description={description}
            buttonLabel={button}
            buttonUrl={url}
            className="w-2/3"
          />
          <ImageComponent src={src} alt={alt} className="w-1/3" />
        </div>
      )}
    </>
  )
}

const SidePartInfoPic = ({
  title,
  description,
  imageAlt: alt,
  imageSrc: src,
  buttonLabel: button,
  buttonUrl: url,
  isTextOnRight,
}: InfopicProps) => {
  return (
    <>
      {/* Mobile-Tablet */}
      <div className="lg:hidden flex flex-col gap-0">
        <ImageComponent src={src} alt={alt} />
        <div className="py-10 px-6 sm:px-20">
          <TextComponent
            title={title}
            description={description}
            buttonLabel={button}
            buttonUrl={url}
          />
        </div>
      </div>
      {/* Desktop */}
      {isTextOnRight ? (
        <div className="hidden lg:flex flex-row gap-0">
          <ImageComponent src={src} alt={alt} className="w-1/2" />
          <div className="w-1/2 py-24 px-10 my-auto">
            <TextComponent
              title={title}
              description={description}
              buttonLabel={button}
              buttonUrl={url}
            />
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-row gap-0">
          <div className="w-1/2 py-24 px-10 my-auto">
            <TextComponent
              title={title}
              description={description}
              buttonLabel={button}
              buttonUrl={url}
            />
          </div>
          <ImageComponent src={src} alt={alt} className="w-1/2" />
        </div>
      )}
    </>
  )
}

const InfoPic = (props: InfopicProps) => {
  if (props.variant === "side-part") {
    return <SidePartInfoPic {...props} />
  }
  return <SideBySideInfoPic {...props} />
}

export default InfoPic
