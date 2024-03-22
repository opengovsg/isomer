import { ArticleCardProps } from "src/common/ArticleCard"

import { Caption } from "../../typography/Caption"
import { Heading } from "../../typography/Heading"
import { Paragraph } from "../../typography/Paragraph"

const ImageComponent = ({ image }: Pick<ArticleCardProps, "image">) => {
  if (!image) return null
  return (
    <img
      src={image.src}
      alt={image.alt}
      className="object-cover max-h-56 w-full rounded-lg"
    />
  )
}

const TextComponent = ({
  lastUpdated,
  category,
  title,
  description,
  variant,
  fileDetails,
}: Pick<
  ArticleCardProps,
  | "lastUpdated"
  | "category"
  | "title"
  | "description"
  | "variant"
  | "fileDetails"
>) => {
  return (
    <div className="flex flex-col gap-3 sm:gap-8">
      <div className={`flex flex-col gap-3`}>
        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
          <p className={`${Caption[1]} text-content-medium`}>{lastUpdated}</p>
          <p className={`${Caption[1]} hidden sm:block text-content-medium`}>
            |
          </p>
          <p className={`${Caption[1]} text-content-strong`}>{category}</p>
        </div>
        <h4 className={`${Heading[4]} line-clamp-3 sm:line-clamp-2`}>{`${
          variant === "file" && fileDetails
            ? `(${fileDetails.type.toUpperCase()}) `
            : ""
        }${title}`}</h4>
        <p
          className={`${Paragraph[2]} text-content-medium line-clamp-3 sm:line-clamp-2`}
        >
          {description}
        </p>
      </div>
      {variant === "file" && fileDetails && (
        <div
          className={`${Paragraph[1]} text-hyperlink underline underline-offset-2`}
        >{`Download (${fileDetails.type.toUpperCase()}, ${
          fileDetails.size
        })`}</div>
      )}
    </div>
  )
}

const Card = ({
  url,
  lastUpdated,
  category,
  title,
  description,
  image,
  variant,
  fileDetails,
}: Omit<ArticleCardProps, "type">) => {
  return (
    <a href={url}>
      <div className="flex flex-col sm:flex-row gap-6 py-6 px-3 sm:px-6 border-y border-divider-medium text-content hover:text-hyperlink-hover">
        <TextComponent
          lastUpdated={lastUpdated}
          category={category}
          description={description}
          title={title}
          variant={variant}
          fileDetails={fileDetails}
        />
        <ImageComponent image={image} />
      </div>
    </a>
  )
}

export default Card
