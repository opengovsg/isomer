export interface Tag {
  title: string
}

export interface FileDetails {
  type: string
  size: string
}

interface Image {
  src: string
  alt: string
}

export interface BaseCardProps {
  type: "collectionCard"
  lastUpdated: string
  category: string
  title: string
  url: string
  description: string
  image?: Image
}

export interface FileCardProps extends BaseCardProps {
  variant: "file"
  fileDetails: FileDetails
}

export interface ArticleCardProps extends BaseCardProps {
  variant: "article"
}

export type CollectionCardProps = FileCardProps | ArticleCardProps

export default CollectionCardProps
