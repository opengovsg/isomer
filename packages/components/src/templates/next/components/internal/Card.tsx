import { BiRightArrowAlt } from "react-icons/bi"
import type { SingleCardProps } from "~/interfaces/complex/InfoCards"

interface CardProps extends SingleCardProps {
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
  className,
}: {
  text: SingleCardProps["description"]
  title: SingleCardProps["title"]
  buttonLabel: SingleCardProps["buttonLabel"]
  className?: string
}) => {
  return (
    <div
      className={`flex flex-grow flex-col justify-between gap-6 px-5 py-6 sm:p-7 ${className}`}
    >
      <div className="flex flex-col gap-3">
        {title && (
          <h4 className="text-heading-04 text-content-strong">{title}</h4>
        )}
        {text && (
          <p className="grow text-left text-base text-content sm:text-lg">
            {text}
          </p>
        )}
      </div>
      {buttonLabel && (
        <div className="flex items-center gap-1">
          <p className="text-button-link-01 text-interaction-link">
            {buttonLabel}
          </p>
          <BiRightArrowAlt className="h-auto w-6 flex-shrink-0" />
        </div>
      )}
    </div>
  )
}

const Card = ({
  title,
  url,
  imageUrl,
  imageAlt,
  description: text,
  className,
  buttonLabel,
  variant,
}: CardProps) => {
  return (
    <a
      className={`flex ${
        variant === "horizontal" ? "flex-row" : "flex-col"
      }  gap-1 border border-divider-medium ${className}`}
      href={url}
      target={url.startsWith("http") ? "_blank" : undefined}
      rel={url.startsWith("http") ? "noopener noreferrer nofollow" : undefined}
    >
      {variant === "horizontal" ? (
        <>
          <ImageComponent
            src={imageUrl}
            alt={imageAlt || title}
            className="w-1/2"
          />
          <TextComponent
            text={text}
            title={title}
            buttonLabel={buttonLabel}
            className="h-full w-1/2"
          />
        </>
      ) : (
        <>
          <ImageComponent
            src={imageUrl}
            alt={imageAlt || title}
            className="h-52"
          />
          <TextComponent text={text} title={title} buttonLabel={buttonLabel} />
        </>
      )}
    </a>
  )
}

export default Card
