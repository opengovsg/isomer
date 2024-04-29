import type { SingleCardProps } from "~/interfaces/complex/InfoCards"
import { Heading } from "../../typography/Heading"
import { BiRightArrowAlt } from "react-icons/bi"
import { ButtonLink } from "../../typography/ButtonLink"

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
      className={`py-6 px-5 sm:p-7 flex flex-col flex-grow gap-6 justify-between ${className}`}
    >
      <div className="flex flex-col gap-3">
        {title && (
          <h4 className={`${Heading[4]} text-content-strong`}>{title}</h4>
        )}
        {text && (
          <p className="text-content text-left text-base sm:text-lg grow">
            {text}
          </p>
        )}
      </div>
      {buttonLabel && (
        <div className={`flex items-center gap-1`}>
          <p className={`text-interaction-link ${ButtonLink[1]}`}>
            {buttonLabel}
          </p>
          <BiRightArrowAlt className="w-6 h-auto flex-shrink-0" />
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
            className="max-h-52"
          />
          <TextComponent text={text} title={title} buttonLabel={buttonLabel} />
        </>
      )}
    </a>
  )
}

export default Card
