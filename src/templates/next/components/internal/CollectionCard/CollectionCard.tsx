import type {
  ArticleCardProps,
  CollectionCardProps,
  FileCardProps,
  LinkCardProps,
} from "~/interfaces/internal/CollectionCard"
import { Caption } from "../../../typography/Caption"
import { Heading } from "../../../typography/Heading"
import { Paragraph } from "../../../typography/Paragraph"

const ImageComponent = ({ image }: Pick<CollectionCardProps, "image">) => {
  if (!image) return null
  return (
    <img
      src={image.src}
      alt={image.alt}
      className="object-cover max-h-56 w-full rounded-lg"
    />
  )
}

const ArticleTextComponent = ({
  lastUpdated,
  category,
  title,
  description,
}: Pick<
  ArticleCardProps,
  "lastUpdated" | "category" | "title" | "description"
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
        <h4 className={`${Heading[4]} line-clamp-3 sm:line-clamp-2`}>
          {title}
        </h4>
        <p
          className={`${Paragraph[2]} text-content-medium line-clamp-3 sm:line-clamp-2`}
        >
          {description}
        </p>
      </div>
    </div>
  )
}

const FileTextComponent = ({
  lastUpdated,
  category,
  title,
  description,
  fileDetails,
}: Pick<
  FileCardProps,
  "lastUpdated" | "category" | "title" | "description" | "fileDetails"
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
        <h4 className={`${Heading[4]} line-clamp-3 sm:line-clamp-2`}>
          {`(${fileDetails.type.toUpperCase()}) ${title}`}
        </h4>
        <p
          className={`${Paragraph[2]} text-content-medium line-clamp-3 sm:line-clamp-2`}
        >
          {description}
        </p>
      </div>
      {
        <div
          className={`${Paragraph[1]} text-hyperlink underline underline-offset-2`}
        >{`Download (${fileDetails.type.toUpperCase()}, ${
          fileDetails.size
        })`}</div>
      }
    </div>
  )
}

const ArticleCard = ({
  url,
  lastUpdated,
  category,
  title,
  description,
  image,
  LinkComponent = "a",
}: Omit<ArticleCardProps | LinkCardProps, "type">) => {
  return (
    <LinkComponent href={url}>
      <div className="flex flex-col sm:flex-row gap-6 py-6 px-3 sm:px-6 border-y border-divider-medium text-content hover:text-hyperlink-hover">
        <ArticleTextComponent
          lastUpdated={lastUpdated}
          category={category}
          description={description}
          title={title}
        />
        <ImageComponent image={image} />
      </div>
    </LinkComponent>
  )
}

const FileCard = ({
  url,
  lastUpdated,
  category,
  title,
  description,
  image,
  fileDetails,
}: Omit<FileCardProps, "type">) => {
  return (
    <a href={url}>
      <div className="flex flex-col sm:flex-row gap-6 py-6 px-3 sm:px-6 border-y border-divider-medium text-content hover:text-hyperlink-hover">
        <FileTextComponent
          lastUpdated={lastUpdated}
          category={category}
          description={description}
          title={title}
          fileDetails={fileDetails}
        />
        <ImageComponent image={image} />
      </div>
    </a>
  )
}

type DistributiveOmit<T, K extends PropertyKey> = T extends any
  ? Omit<T, K>
  : never

const Card = (props: DistributiveOmit<CollectionCardProps, "type">) => {
  if (props.variant === "file") {
    return <FileCard {...props} />
  } else if (props.variant === "article" || props.variant === "link") {
    return <ArticleCard {...props} />
  }

  return <></>
}

export default Card
