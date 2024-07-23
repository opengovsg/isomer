import type { InfopicProps } from "~/interfaces"
import { ComponentContent } from "../../internal/customCssClass"
import Button from "../Button"

type TextComponentProps = Pick<
  InfopicProps,
  "title" | "description" | "buttonLabel" | "buttonUrl"
> & {
  className?: string
}

type ImageComponentProps = Pick<InfopicProps, "imageSrc" | "imageAlt"> & {
  className?: string
}

const TextComponent = ({
  title,
  description,
  buttonLabel,
  buttonUrl,
  className,
}: TextComponentProps) => {
  return (
    <div className={`flex flex-col gap-6 ${className ?? ""}`}>
      <div className="flex flex-col gap-4 sm:gap-6">
        <h1 className="text-2xl font-bold text-content sm:text-4xl">{title}</h1>
        {description && (
          <p className="text-sm text-content sm:text-lg">{description}</p>
        )}
      </div>
      {buttonLabel && buttonUrl && (
        <Button label={buttonLabel} href={buttonUrl} rightIcon="right-arrow" />
      )}
    </div>
  )
}

const ImageComponent = ({
  imageSrc,
  imageAlt,
  className,
}: ImageComponentProps) => {
  return (
    <div
      className={`aspect-h-1 aspect-w-1 my-auto overflow-hidden ${className ?? ""}`}
    >
      <img
        src={imageSrc}
        alt={imageAlt}
        className="max-h-[22.5rem] w-full object-cover object-center lg:max-h-[38.75rem]"
      />
    </div>
  )
}

const InfoPic = ({
  imageSrc,
  imageAlt,
  title,
  description,
  buttonLabel,
  buttonUrl,
  isTextOnRight,
}: InfopicProps) => {
  return (
    <>
      {/* Mobile-Tablet */}
      <div className="md:hidden">
        <div
          className={`${ComponentContent} flex flex-col gap-10 py-16 sm:px-14 sm:py-12`}
        >
          <ImageComponent
            imageSrc={imageSrc}
            imageAlt={imageAlt}
            className="rounded-xl"
          />
          <TextComponent
            title={title}
            description={description}
            buttonLabel={buttonLabel}
            buttonUrl={buttonUrl}
          />
        </div>
      </div>
      {/* Desktop */}
      <div className="hidden md:block">
        <div
          className={`${ComponentContent} flex ${
            isTextOnRight ? "flex-row" : "flex-row-reverse"
          } gap-16 py-24`}
        >
          <ImageComponent
            imageSrc={imageSrc}
            imageAlt={imageAlt}
            className="w-1/2 rounded-xl"
          />
          <TextComponent
            title={title}
            description={description}
            buttonLabel={buttonLabel}
            buttonUrl={buttonUrl}
            className="w-1/2 justify-center"
          />
        </div>
      </div>
    </>
  )
}

export default InfoPic
