import { SingleCardProps } from "~/common/InfoCards"
import { BiRightArrowAlt } from "react-icons/bi"

interface KeyStatisticsProps extends SingleCardProps {
  variant?: "horizontal" | "vertical"
  className?: string
}

const ImageComponent = ({
  src,
  alt,
  className,
}: {
  src: SingleCardProps["imageUrl"]
  alt: SingleCardProps["imageAlt"]
  className?: string
}) => {
  return (
    <div className={`aspect-h-1 aspect-w-1 overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-center"
      />
    </div>
  )
}

const TextComponent = ({
  title,
  text,
  buttonLabel,
  buttonUrl,
  className,
}: {
  text: SingleCardProps["text"]
  title: SingleCardProps["title"]
  buttonLabel: SingleCardProps["buttonLabel"]
  buttonUrl: SingleCardProps["buttonUrl"]
  className?: string
}) => {
  return (
    <div className={`p-7 flex flex-col flex-grow gap-3 h-fit ${className}`}>
      {title && (
        <h4 className="text-content text-left text-lg font-semibold sm:text-2xl">
          {title}
        </h4>
      )}
      <div className="text-content text-left text-base sm:text-lg grow">
        {text}
      </div>
      {buttonLabel && buttonUrl && (
        <a
          className="flex flex-row gap-1 items-center font-semibold text-secondary text-md sm:text-lg"
          href={buttonUrl}
          target={buttonUrl?.startsWith("http") ? "_blank" : undefined}
          rel={
            buttonUrl?.startsWith("http")
              ? "noopener noreferrer nofollow"
              : undefined
          }
        >
          {buttonLabel}
          <BiRightArrowAlt className="size-6" />
        </a>
      )}
    </div>
  )
}

const Card = ({
  title,
  imageUrl,
  imageAlt,
  text,
  className,
  buttonLabel,
  buttonUrl,
  variant,
}: KeyStatisticsProps) => {
  if (variant === "horizontal")
    return (
      <div
        className={`flex flex-row gap-1 border-2 border-divider-medium ${className}`}
      >
        <ImageComponent
          src={imageUrl}
          alt={imageAlt || title}
          className="w-1/2"
        />
        <TextComponent
          text={text}
          title={title}
          buttonLabel={buttonLabel}
          buttonUrl={buttonUrl}
          className="h-full w-1/2"
        />
      </div>
    )
  return (
    <div
      className={`flex flex-col gap-1 border-2 border-divider-medium ${className}`}
    >
      <ImageComponent
        src={imageUrl}
        alt={imageAlt || title}
        className="max-h-52"
      />
      <TextComponent
        text={text}
        title={title}
        buttonLabel={buttonLabel}
        buttonUrl={buttonUrl}
      />
    </div>
  )
}

export default Card
