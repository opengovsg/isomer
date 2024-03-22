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

export interface ArticleCardProps {
  type: "articleCard"
  lastUpdated: string
  category: string
  title: string
  url: string
  description: string
  image?: Image
  variant: "file" | "article"
  fileDetails?: FileDetails
}

export default ArticleCardProps
