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
  url,
}: {
  text: SingleCardProps["description"]
  title: SingleCardProps["title"]
  buttonLabel: SingleCardProps["buttonLabel"]
  className?: string
  url: string
}) => {
  return (
    <div
      className={`flex flex-grow flex-col justify-between gap-6 px-5 py-6 sm:p-5 ${className}`}
    >
      <div className="flex flex-col gap-3">
        {title && (
          <h4 className="line-clamp-2 text-content-strong text-heading-04">
            {title}
          </h4>
        )}
        {text && (
          <p className="line-clamp-4 grow text-left text-base text-content sm:text-lg">
            {text}
          </p>
        )}
      </div>
      {buttonLabel && (
        <div className={`flex items-center gap-1`}>
          <a
            href={url}
            target={url.startsWith("http") ? "_blank" : undefined}
            rel={
              url.startsWith("http")
                ? "noopener noreferrer nofollow"
                : undefined
            }
            className="font-medium text-interaction-link after:absolute after:inset-0"
          >
            {buttonLabel}
          </a>
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
    <div
      className={`relative flex ${
        variant === "horizontal" ? "flex-row" : "flex-col"
      } gap-1 rounded-md outline outline-divider-medium hover:opacity-80 ${className}`}
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
            url={url}
          />
        </>
      ) : (
        <>
          <ImageComponent
            src={imageUrl}
            alt={imageAlt || title}
            className="h-52"
          />
          <TextComponent
            text={text}
            title={title}
            buttonLabel={buttonLabel}
            url={url}
          />
        </>
      )}
    </div>
  )
}

export default Card
