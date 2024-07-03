import type {
  ArticleCardProps,
  CollectionCardProps,
  FileCardProps,
  LinkCardProps,
} from "~/interfaces/internal/CollectionCard";

const ImageComponent = ({ image }: Pick<CollectionCardProps, "image">) => {
  if (!image) return null;
  return (
    <img
      src={image.src}
      alt={image.alt}
      className="max-h-56 w-full rounded-lg object-cover"
    />
  );
};

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
        <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
          <p className="text-content-medium text-caption-01">{lastUpdated}</p>
          <p className="hidden text-content-medium text-caption-01 sm:block">
            |
          </p>
          <p className="text-content-strong text-caption-01">{category}</p>
        </div>
        <h4 className="line-clamp-3 text-heading-04 sm:line-clamp-2">
          {title}
        </h4>
        <p className="line-clamp-3 text-content-medium text-paragraph-02 sm:line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  );
};

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
        <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
          <p className="text-content-medium text-caption-01">{lastUpdated}</p>
          <p className="hidden text-content-medium text-caption-01 sm:block">
            |
          </p>
          <p className="text-content-strong text-caption-01">{category}</p>
        </div>
        <h4 className="line-clamp-3 text-heading-04 sm:line-clamp-2">
          {`(${fileDetails.type.toUpperCase()}) ${title}`}
        </h4>
        <p className="line-clamp-3 text-content-medium text-paragraph-02 sm:line-clamp-2">
          {description}
        </p>
      </div>
      {
        <div className="text-hyperlink underline underline-offset-2 text-paragraph-01">{`Download (${fileDetails.type.toUpperCase()}, ${
          fileDetails.size
        })`}</div>
      }
    </div>
  );
};

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
      <div className="flex flex-col gap-6 border-y border-divider-medium py-6 text-content hover:text-hyperlink-hover sm:flex-row">
        <ArticleTextComponent
          lastUpdated={lastUpdated}
          category={category}
          description={description}
          title={title}
        />
        <ImageComponent image={image} />
      </div>
    </LinkComponent>
  );
};

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
      <div className="flex flex-col gap-6 border-y border-divider-medium py-6 text-content hover:text-hyperlink-hover sm:flex-row">
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
  );
};

type DistributiveOmit<T, K extends PropertyKey> = T extends any
  ? Omit<T, K>
  : never;

const Card = (props: DistributiveOmit<CollectionCardProps, "type">) => {
  if (props.variant === "file") {
    return <FileCard {...props} />;
  } else if (props.variant === "article" || props.variant === "link") {
    return <ArticleCard {...props} />;
  }

  return <></>;
};

export default Card;
